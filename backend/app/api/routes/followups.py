"""
Clinical follow-ups & action items routes (Phase E).
"""
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database.mongodb import get_db
from app.core.dependencies import get_current_user, require_roles
from app.core.encryption import encrypt_doc, decrypt_doc, decrypt_docs
from app.schemas.followup import FollowUpCreate, FollowUpUpdate, FollowUpResponse
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/followups", tags=["Followups"])

def _serialize(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not doc:
        return None
    d = dict(doc)
    if "_id" in d:
        d["_id"] = str(d["_id"])
        d["id"] = d["_id"]
    return d

@router.get("", summary="List clinical follow-ups / tasks")
async def list_followups(
    patient_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    query: Dict[str, Any] = {}
    if patient_id:
        query["patient_id"] = patient_id.strip()
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority

    if current_user.get("role") == "patient":
        user_pat_id = current_user.get("patient_id")
        if not user_pat_id:
            pat = await db.patients.find_one({"user_id": str(current_user["_id"])})
            if pat:
                user_pat_id = pat.get("patient_id")
        query["patient_id"] = user_pat_id

    raw = await db.followups.find(query).sort("due_date", 1).skip(skip).limit(limit).to_list(limit)
    decrypted = [_serialize(decrypt_doc(f, "followups")) for f in raw]
    total = await db.followups.count_documents(query)

    return {
        "items": decrypted,
        "total": total,
        "limit": limit,
        "skip": skip
    }

@router.post("", summary="Create clinical follow-up item", status_code=status.HTTP_201_CREATED)
async def create_followup(
    payload: FollowUpCreate,
    current_user: dict = Depends(require_roles(["doctor", "staff", "admin"])),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    fol_id = f"FOL-{uuid.uuid4().hex[:8].upper()}"

    pat = await db.patients.find_one({"patient_id": payload.patient_id.strip()})
    dec_pat = decrypt_doc(pat, "patients") if pat else {}
    patient_name = f"{dec_pat.get('first_name', '')} {dec_pat.get('last_name', '')}".strip() or payload.patient_id

    fol_data = payload.model_dump()
    fol_data["followup_id"] = fol_id
    fol_data["patient_name"] = patient_name
    fol_data["created_by"] = str(current_user["_id"])
    fol_data["creator_name"] = current_user.get("full_name", "Clinical Staff")
    fol_data["status"] = "pending"
    fol_data["resolution_notes"] = None
    fol_data["completed_at"] = None
    fol_data["created_at"] = now

    encrypted = encrypt_doc(fol_data, "followups")
    result = await db.followups.insert_one(encrypted)

    await log_audit_event(
        db=db,
        user_id=str(current_user["_id"]),
        user_email=current_user.get("email"),
        role=current_user.get("role"),
        action="create",
        resource="followup",
        resource_id=fol_id,
        details={"patient_id": payload.patient_id, "title": payload.title}
    )

    fol_data["_id"] = str(result.inserted_id)
    fol_data["id"] = fol_data["_id"]
    return fol_data

@router.put("/{followup_id}", summary="Update or complete follow-up item")
async def update_followup(
    followup_id: str,
    payload: FollowUpUpdate,
    current_user: dict = Depends(require_roles(["doctor", "staff", "admin"])),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    existing = await db.followups.find_one({"followup_id": followup_id.strip()})
    if not existing:
        raise HTTPException(status_code=404, detail="Follow-up not found")

    update_dict = {k: v for k, v in payload.model_dump().items() if v is not None}
    if update_dict.get("status") == "completed" and "completed_at" not in update_dict:
        update_dict["completed_at"] = datetime.now(timezone.utc)
    update_dict["updated_at"] = datetime.now(timezone.utc)

    encrypted_update = encrypt_doc(update_dict, "followups")
    await db.followups.update_one({"followup_id": followup_id.strip()}, {"$set": encrypted_update})

    updated_raw = await db.followups.find_one({"followup_id": followup_id.strip()})
    return _serialize(decrypt_doc(updated_raw, "followups"))
