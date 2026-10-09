"""
Clinical appointments scheduling routes (Phase E).
"""
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database.mongodb import get_db
from app.core.dependencies import get_current_user, require_roles
from app.core.encryption import encrypt_doc, decrypt_doc, decrypt_docs
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate, AppointmentResponse
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/appointments", tags=["Appointments"])

def _serialize(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not doc:
        return None
    d = dict(doc)
    if "_id" in d:
        d["_id"] = str(d["_id"])
        d["id"] = d["_id"]
    return d

@router.get("", summary="List clinical appointments")
async def list_appointments(
    patient_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    doctor_id: Optional[str] = Query(None),
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
    if doctor_id:
        query["doctor_id"] = doctor_id

    # If patient, enforce viewing only own appointments
    if current_user.get("role") == "patient":
        user_pat_id = current_user.get("patient_id")
        if not user_pat_id:
            pat = await db.patients.find_one({"user_id": str(current_user["_id"])})
            if pat:
                user_pat_id = pat.get("patient_id")
        query["patient_id"] = user_pat_id

    raw = await db.appointments.find(query).sort("start_time", 1).skip(skip).limit(limit).to_list(limit)
    decrypted = [_serialize(decrypt_doc(a, "appointments")) for a in raw]
    total = await db.appointments.count_documents(query)

    return {
        "items": decrypted,
        "total": total,
        "limit": limit,
        "skip": skip
    }

@router.post("", summary="Schedule clinical appointment", status_code=status.HTTP_201_CREATED)
async def create_appointment(
    payload: AppointmentCreate,
    current_user: dict = Depends(require_roles(["doctor", "staff", "admin"])),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    appt_id = f"APP-{uuid.uuid4().hex[:8].upper()}"

    # Lookup patient name
    pat = await db.patients.find_one({"patient_id": payload.patient_id.strip()})
    dec_pat = decrypt_doc(pat, "patients") if pat else {}
    patient_name = f"{dec_pat.get('first_name', '')} {dec_pat.get('last_name', '')}".strip() or payload.patient_id

    # Lookup doctor name
    doc_user = await db.users.find_one({"_id": payload.doctor_id}) if len(payload.doctor_id) == 24 else None
    doctor_name = doc_user.get("full_name") if doc_user else current_user.get("full_name", "Clinical Staff")

    appt_data = payload.model_dump()
    appt_data["appointment_id"] = appt_id
    appt_data["patient_name"] = patient_name
    appt_data["doctor_name"] = doctor_name
    appt_data["status"] = "scheduled"
    appt_data["created_at"] = now

    encrypted = encrypt_doc(appt_data, "appointments")
    result = await db.appointments.insert_one(encrypted)

    await log_audit_event(
        db=db,
        user_id=str(current_user["_id"]),
        user_email=current_user.get("email"),
        role=current_user.get("role"),
        action="create",
        resource="appointment",
        resource_id=appt_id,
        details={"patient_id": payload.patient_id, "start_time": str(payload.start_time)}
    )

    appt_data["_id"] = str(result.inserted_id)
    appt_data["id"] = appt_data["_id"]
    return appt_data

@router.put("/{appointment_id}", summary="Update appointment status or details")
async def update_appointment(
    appointment_id: str,
    payload: AppointmentUpdate,
    current_user: dict = Depends(require_roles(["doctor", "staff", "admin"])),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    existing = await db.appointments.find_one({"appointment_id": appointment_id.strip()})
    if not existing:
        raise HTTPException(status_code=404, detail="Appointment not found")

    update_dict = {k: v for k, v in payload.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc)

    encrypted_update = encrypt_doc(update_dict, "appointments")
    await db.appointments.update_one({"appointment_id": appointment_id.strip()}, {"$set": encrypted_update})

    updated_raw = await db.appointments.find_one({"appointment_id": appointment_id.strip()})
    return _serialize(decrypt_doc(updated_raw, "appointments"))
