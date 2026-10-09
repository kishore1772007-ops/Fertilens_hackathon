"""
Clinical patient management routes (Phase B & Timeline Engine).
"""
import uuid
import re
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database.mongodb import get_db
from app.core.dependencies import get_current_user, require_roles
from app.core.encryption import (
    encrypt_doc,
    decrypt_doc,
    decrypt_docs,
    compute_blind_index_token
)
from app.services.audit_service import log_audit_event
from app.schemas.patient import PatientCreate, PatientUpdate, PatientResponse
from app.schemas.medical_record import MedicalRecordCreate, MedicalRecordResponse
from app.core.logging_config import logger

router = APIRouter(prefix="/patients", tags=["Patients"])

def _serialize(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not doc:
        return None
    d = dict(doc)
    if "_id" in d:
        d["_id"] = str(d["_id"])
        d["id"] = d["_id"]
    return d

@router.get("", summary="List clinical patients with filtering & search")
async def list_patients(
    search: Optional[str] = Query(None, description="Search by name, ID, or MRN"),
    stage: Optional[str] = Query(None, description="Filter by treatment stage"),
    status: Optional[str] = Query(None, description="Filter by status (active/inactive)"),
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0),
    current_user: dict = Depends(require_roles(["doctor", "staff", "admin"])),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    query: Dict[str, Any] = {}
    if status:
        query["status"] = status
    if stage:
        query["treatment_stage"] = stage

    # If search provided
    if search and search.strip():
        s = search.strip()
        # If matches patient ID or MRN pattern
        if re.match(r'^(P\d+|PAT-\d+|MRN-)', s, re.IGNORECASE):
            query["$or"] = [
                {"patient_id": {"$regex": f"^{re.escape(s)}", "$options": "i"}},
                {"mrn": {"$regex": f"^{re.escape(s)}", "$options": "i"}}
            ]
        else:
            # Blind index token search for names
            tokens = [compute_blind_index_token(w.lower()) for w in s.split() if len(w) >= 2]
            if tokens:
                query["name_search_tokens"] = {"$in": tokens}

    cursor = db.patients.find(query).sort("created_at", -1).skip(skip).limit(limit)
    raw_docs = await cursor.to_list(length=limit)
    decrypted_patients = [_serialize(decrypt_doc(d, "patients")) for d in raw_docs]
    total = await db.patients.count_documents(query)

    return {
        "items": decrypted_patients,
        "total": total,
        "limit": limit,
        "skip": skip
    }

@router.get("/search/advanced", summary="Multi-criteria advanced clinical search")
async def advanced_patient_search(
    query_str: Optional[str] = Query(None, alias="q"),
    min_amh: Optional[float] = Query(None),
    max_amh: Optional[float] = Query(None),
    diagnosis: Optional[str] = Query(None),
    stage: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=50),
    current_user: dict = Depends(require_roles(["doctor", "staff", "admin"])),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    filter_dict: Dict[str, Any] = {}

    if query_str and query_str.strip():
        q_clean = query_str.strip()
        if re.match(r'^(P\d+|PAT-\d+|MRN-)', q_clean, re.IGNORECASE):
            filter_dict["$or"] = [
                {"patient_id": {"$regex": f"^{re.escape(q_clean)}", "$options": "i"}},
                {"mrn": {"$regex": f"^{re.escape(q_clean)}", "$options": "i"}}
            ]
        else:
            tokens = [compute_blind_index_token(w.lower()) for w in q_clean.split() if len(w) >= 2]
            if tokens:
                filter_dict["name_search_tokens"] = {"$in": tokens}

    if min_amh is not None or max_amh is not None:
        amh_filter: Dict[str, Any] = {}
        if min_amh is not None:
            amh_filter["$gte"] = min_amh
        if max_amh is not None:
            amh_filter["$lte"] = max_amh
        filter_dict["amh_level"] = amh_filter

    if diagnosis:
        filter_dict["primary_diagnosis"] = {"$regex": re.escape(diagnosis), "$options": "i"}
    if stage:
        filter_dict["treatment_stage"] = stage

    raw_docs = await db.patients.find(filter_dict).limit(limit).to_list(limit)
    return [_serialize(decrypt_doc(d, "patients")) for d in raw_docs]

@router.post("", summary="Register new patient profile", status_code=status.HTTP_201_CREATED)
async def create_patient(
    payload: PatientCreate,
    current_user: dict = Depends(require_roles(["doctor", "staff", "admin"])),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    # Generate unique patient_id and mrn
    count = await db.patients.count_documents({}) + 1001
    patient_id = f"PAT-{count}"
    mrn = f"MRN-{count}-{payload.last_name[:2].upper()}"

    doc_data = payload.model_dump()
    doc_data["patient_id"] = patient_id
    doc_data["mrn"] = mrn
    doc_data["status"] = "active"
    doc_data["created_at"] = now
    doc_data["updated_at"] = now

    # Encrypt and persist
    encrypted = encrypt_doc(doc_data, "patients")
    result = await db.patients.insert_one(encrypted)

    await log_audit_event(
        db=db,
        user_id=str(current_user["_id"]),
        user_email=current_user.get("email"),
        role=current_user.get("role"),
        action="create",
        resource="patient",
        resource_id=patient_id,
        details={"name": f"{payload.first_name} {payload.last_name}"}
    )

    doc_data["_id"] = str(result.inserted_id)
    doc_data["id"] = doc_data["_id"]
    return doc_data

@router.get("/{patient_id}", summary="Get single patient 360 profile")
async def get_patient_details(
    patient_id: str,
    current_user: dict = Depends(require_roles(["doctor", "staff", "admin"])),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    raw = await db.patients.find_one({"patient_id": patient_id.strip()})
    if not raw:
        # Check by _id fallback
        raw = await db.patients.find_one({"mrn": patient_id.strip()})
    if not raw:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    decrypted = decrypt_doc(raw, "patients")
    return _serialize(decrypted)

@router.put("/{patient_id}", summary="Update patient profile")
async def update_patient(
    patient_id: str,
    payload: PatientUpdate,
    current_user: dict = Depends(require_roles(["doctor", "staff", "admin"])),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    existing = await db.patients.find_one({"patient_id": patient_id.strip()})
    if not existing:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    update_dict = {k: v for k, v in payload.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc)

    # Re-encrypt updated fields
    encrypted_update = encrypt_doc(update_dict, "patients")
    await db.patients.update_one({"patient_id": patient_id.strip()}, {"$set": encrypted_update})

    updated_raw = await db.patients.find_one({"patient_id": patient_id.strip()})
    return _serialize(decrypt_doc(updated_raw, "patients"))

# ----------------- Medical Records Sub-Routes ----------------- #

@router.get("/{patient_id}/records", summary="Get patient medical records")
async def get_patient_records(
    patient_id: str,
    current_user: dict = Depends(require_roles(["doctor", "staff", "admin"])),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    raw_records = await db.medical_records.find({"patient_id": patient_id.strip()}).sort("date", -1).to_list(100)
    decrypted_records = [_serialize(decrypt_doc(r, "medical_records")) for r in raw_records]
    return decrypted_records

@router.post("/{patient_id}/records", summary="Add new clinical medical record", status_code=201)
async def create_medical_record(
    patient_id: str,
    payload: MedicalRecordCreate,
    current_user: dict = Depends(require_roles(["doctor", "staff", "admin"])),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    rec_count = await db.medical_records.count_documents({"patient_id": patient_id.strip()}) + 1
    record_id = f"REC-{patient_id.strip()}-{rec_count}"

    rec_data = payload.model_dump()
    rec_data["record_id"] = record_id
    rec_data["patient_id"] = patient_id.strip()
    rec_data["doctor_id"] = str(current_user["_id"])
    rec_data["doctor_name"] = current_user.get("full_name", "Attending Clinician")
    rec_data["date"] = payload.date or now
    rec_data["created_at"] = now

    encrypted = encrypt_doc(rec_data, "medical_records")
    result = await db.medical_records.insert_one(encrypted)

    await log_audit_event(
        db=db,
        user_id=str(current_user["_id"]),
        user_email=current_user.get("email"),
        role=current_user.get("role"),
        action="create",
        resource="medical_record",
        resource_id=record_id,
        details={"patient_id": patient_id, "type": payload.record_type}
    )

    rec_data["_id"] = str(result.inserted_id)
    rec_data["id"] = rec_data["_id"]
    return rec_data

# ----------------- Patient Timeline Engine (Phase E) ----------------- #

@router.get("/{patient_id}/timeline", summary="Patient 360 Visual Timeline Engine")
async def get_patient_timeline(
    patient_id: str,
    current_user: dict = Depends(require_roles(["doctor", "staff", "admin"])),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Aggregates all chronological events for a patient:
    - Appointments (scheduled & completed)
    - Medical records (consultations, lab panels, ultrasounds)
    - Documents indexed
    - Follow-ups created and completed
    """
    events = []

    # 1. Medical records
    raw_recs = await db.medical_records.find({"patient_id": patient_id.strip()}).to_list(100)
    for r in raw_recs:
        dec = decrypt_doc(r, "medical_records")
        events.append({
            "id": dec.get("record_id"),
            "event_type": "clinical_record",
            "subtype": dec.get("record_type"),
            "title": dec.get("title"),
            "timestamp": dec.get("date"),
            "summary": dec.get("clinical_summary"),
            "findings": dec.get("findings"),
            "plan": dec.get("plan"),
            "doctor_name": dec.get("doctor_name"),
            "tags": dec.get("tags", [])
        })

    # 2. Appointments
    raw_appts = await db.appointments.find({"patient_id": patient_id.strip()}).to_list(50)
    for a in raw_appts:
        dec = decrypt_doc(a, "appointments")
        events.append({
            "id": dec.get("appointment_id"),
            "event_type": "appointment",
            "subtype": dec.get("appointment_type"),
            "title": dec.get("title"),
            "timestamp": dec.get("start_time"),
            "summary": f"Status: {dec.get('status')} • Location: {dec.get('location')}",
            "notes": dec.get("notes"),
            "doctor_name": dec.get("doctor_name"),
            "status": dec.get("status")
        })

    # 3. Documents
    raw_docs = await db.documents.find({"patient_id": patient_id.strip()}).to_list(50)
    for d in raw_docs:
        dec = decrypt_doc(d, "documents")
        events.append({
            "id": dec.get("document_id"),
            "event_type": "document",
            "subtype": "PDF Upload",
            "title": dec.get("title"),
            "timestamp": dec.get("created_at"),
            "summary": f"File: {dec.get('original_filename')} ({dec.get('status')})",
            "approved": dec.get("approved_for_patient"),
            "status": dec.get("status")
        })

    # 4. Follow-ups
    raw_fols = await db.followups.find({"patient_id": patient_id.strip()}).to_list(50)
    for f in raw_fols:
        dec = decrypt_doc(f, "followups")
        events.append({
            "id": dec.get("followup_id"),
            "event_type": "followup",
            "subtype": dec.get("category"),
            "title": dec.get("title"),
            "timestamp": dec.get("due_date"),
            "summary": dec.get("description"),
            "priority": dec.get("priority"),
            "status": dec.get("status")
        })

    # Sort events chronologically descending
    events.sort(key=lambda x: str(x.get("timestamp") or ""), reverse=True)

    return {
        "patient_id": patient_id,
        "total_events": len(events),
        "events": events
    }
