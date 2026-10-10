"""
Clinical patient management routes (Phase B & Timeline Engine).
"""
import uuid
import re
from datetime import datetime, timezone, date
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database.mongodb import get_db
from app.core.dependencies import get_current_user, require_roles, require_patient
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

def _calculate_age(dob_val: Optional[str]) -> Optional[int]:
    if not dob_val:
        return None
    try:
        birth_date = date.fromisoformat(str(dob_val).split("T")[0])
        today = date.today()
        age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
        return max(0, age)
    except Exception:
        try:
            birth_year = int(str(dob_val).split("-")[0])
            return max(0, date.today().year - birth_year)
        except Exception:
            return None

def _serialize(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not doc:
        return None
    d = dict(doc)
    if "_id" in d:
        d["_id"] = str(d["_id"])
        d["id"] = d["_id"]
    if d.get("age") is None and d.get("dob"):
        d["age"] = _calculate_age(d.get("dob"))
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

    # Convert DOB to Age or Age to DOB
    if payload.dob:
        calc_age = _calculate_age(payload.dob)
        doc_data["age"] = payload.age if payload.age is not None else calc_age
    elif payload.age is not None:
        doc_data["age"] = payload.age
        est_year = now.year - payload.age
        doc_data["dob"] = f"{est_year}-01-01"

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

# ----------------- Patient Self Profile & Journey (Phase G) ----------------- #

@router.get("/me", summary="Get authenticated patient profile")
async def get_patient_profile_me(
    patient_auth: dict = Depends(require_patient),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    patient_doc = _serialize(patient_auth["patient_doc"])
    # Resolve attending doctor information if available
    doctor_info = None
    if patient_doc.get("assigned_doctor_name"):
        doctor_info = {
            "full_name": patient_doc.get("assigned_doctor_name"),
            "specialty": "Reproductive Endocrinologist & ART Specialist",
            "department": "Department of Reproductive Medicine"
        }
    elif patient_doc.get("assigned_doctor_id"):
        try:
            from bson import ObjectId
            doc_user = await db.users.find_one({"_id": ObjectId(patient_doc["assigned_doctor_id"])})
            if doc_user:
                doctor_info = {
                    "full_name": doc_user.get("full_name"),
                    "email": doc_user.get("email"),
                    "specialty": "Reproductive Endocrinologist"
                }
        except Exception:
            pass

    return {
        "patient": patient_doc,
        "doctor": doctor_info
    }

@router.put("/me", summary="Update patient contact, emergency & partner details")
async def update_patient_profile_me(
    payload: PatientUpdate,
    patient_auth: dict = Depends(require_patient),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    patient_id = patient_auth["verified_patient_id"]
    existing = await db.patients.find_one({"patient_id": patient_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    allowed_fields = {"phone", "email", "address", "emergency_contact", "partner"}
    update_dict = {k: v for k, v in payload.model_dump().items() if k in allowed_fields and v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc)

    encrypted_update = encrypt_doc(update_dict, "patients")
    await db.patients.update_one({"patient_id": patient_id}, {"$set": encrypted_update})

    await log_audit_event(
        db=db,
        user_id=str(patient_auth["_id"]),
        user_email=patient_auth.get("email"),
        role="patient",
        action="update_profile",
        resource="patient",
        resource_id=patient_id,
        details={"updated_fields": list(update_dict.keys())}
    )

    updated_raw = await db.patients.find_one({"patient_id": patient_id})
    return _serialize(decrypt_doc(updated_raw, "patients"))

@router.get("/me/timeline", summary="Get authenticated patient treatment journey and timeline")
async def get_patient_timeline_me(
    patient_auth: dict = Depends(require_patient),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    patient_id = patient_auth["verified_patient_id"]
    patient_profile = _serialize(patient_auth["patient_doc"])
    events = []

    # 1. Medical records
    raw_recs = await db.medical_records.find({"patient_id": patient_id}).to_list(100)
    for r in raw_recs:
        dec = decrypt_doc(r, "medical_records")
        events.append({
            "id": dec.get("record_id"),
            "event_type": "clinical_record",
            "subtype": dec.get("record_type"),
            "title": dec.get("title"),
            "timestamp": dec.get("date"),
            "summary": dec.get("clinical_summary") or dec.get("notes"),
            "findings": dec.get("findings"),
            "plan": dec.get("plan"),
            "doctor_name": dec.get("doctor_name"),
            "tags": dec.get("tags", [])
        })

    # 2. Appointments
    raw_appts = await db.appointments.find({"patient_id": patient_id}).to_list(50)
    for a in raw_appts:
        dec = decrypt_doc(a, "appointments")
        events.append({
            "id": dec.get("appointment_id"),
            "event_type": "appointment",
            "subtype": dec.get("appointment_type"),
            "title": dec.get("title"),
            "timestamp": dec.get("start_time"),
            "summary": f"Status: {dec.get('status')} • Location: {dec.get('location', 'Clinic')}",
            "notes": dec.get("notes"),
            "doctor_name": dec.get("doctor_name"),
            "status": dec.get("status")
        })

    # 3. Documents (approved only)
    raw_docs = await db.documents.find({
        "patient_id": patient_id,
        "approved_for_patient": True
    }).to_list(50)
    for d in raw_docs:
        dec = decrypt_doc(d, "documents")
        events.append({
            "id": dec.get("document_id"),
            "event_type": "document",
            "subtype": dec.get("document_type", "PDF Upload"),
            "title": dec.get("title"),
            "timestamp": dec.get("created_at"),
            "summary": f"File: {dec.get('original_filename')} ({dec.get('status')})",
            "approved": True,
            "status": dec.get("status")
        })

    # 4. Follow-ups
    raw_fols = await db.followups.find({"patient_id": patient_id}).to_list(50)
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

    # Standard IVF / ART Clinical Roadmap Stages
    standard_stages = [
        {
            "id": "stage_1",
            "name": "Diagnostic Workup & Baseline Evaluation",
            "short_name": "Workup & Baseline",
            "description": "Baseline hormone profile (AMH, FSH, LH, E2), ultrasound AFC scan, infectious panels, and fertility history.",
            "duration": "Cycle Days 1 - 3",
            "key_actions": ["Transvaginal Ultrasound (AFC)", "Baseline Blood Panels", "Clinical Consultation"]
        },
        {
            "id": "stage_2",
            "name": "Controlled Ovarian Stimulation",
            "short_name": "Ovarian Stimulation",
            "description": "Daily gonadotropin injections (rFSH/hMG) to stimulate multiple follicular recruitment and egg maturation.",
            "duration": "8 - 12 Days",
            "key_actions": ["Daily Hormone Injections", "Serial Folliculometry Scans", "Serum Estradiol Monitoring"]
        },
        {
            "id": "stage_3",
            "name": "Ovulation Trigger & Pre-Retrieval Prep",
            "short_name": "Follicle Trigger",
            "description": "Administration of hCG or GnRH agonist trigger shot precisely 34-36 hours prior to planned retrieval.",
            "duration": "Precisely timed (36h)",
            "key_actions": ["Trigger Injection Timing", "Strict Fasting Guidelines", "Anesthesia Clearance"]
        },
        {
            "id": "stage_4",
            "name": "Oocyte Retrieval & Semen Collection",
            "short_name": "Egg Retrieval (OPU)",
            "description": "Ultrasound-guided transvaginal aspiration of mature oocytes under light intravenous sedation.",
            "duration": "Day 0",
            "key_actions": ["Aspiration Procedure (15-20 min)", "Oocyte Identification", "Sperm Washing & Prep"]
        },
        {
            "id": "stage_5",
            "name": "Fertilization & Embryo Culture",
            "short_name": "Fertilization & Culture",
            "description": "ICSI or conventional insemination followed by extended incubation to Day 3 or Day 5/6 blastocyst stage.",
            "duration": "Days 1 - 6",
            "key_actions": ["Fertilization Check (2PN)", "Embryo Grading Updates", "Time-Lapse Incubator Monitoring"]
        },
        {
            "id": "stage_6",
            "name": "Embryo Transfer",
            "short_name": "Embryo Transfer",
            "description": "Catheter-guided placement of top-graded blastocyst into uterine cavity under abdominal ultrasound visualization.",
            "duration": "Day 3 or Day 5",
            "key_actions": ["Full Bladder Preparation", "Gentle Catheter Placement", "Post-Transfer Rest & Discharge"]
        },
        {
            "id": "stage_7",
            "name": "Luteal Phase Support & Pregnancy Confirmation",
            "short_name": "Luteal Support & Test",
            "description": "Progesterone and estrogen supplementation to support endometrial receptivity, followed by serum Beta-hCG blood test.",
            "duration": "10 - 14 Days Post-Transfer",
            "key_actions": ["Micronized Progesterone Support", "Hydration & Gentle Activity", "Quantitative Serum Beta-hCG Draw"]
        }
    ]

    current_stage_name = patient_profile.get("treatment_stage") or "Controlled Ovarian Stimulation"

    return {
        "patient": patient_profile,
        "current_stage": current_stage_name,
        "stages": standard_stages,
        "total_events": len(events),
        "events": events
    }

@router.get("/{patient_id}", summary="Get single patient 360 profile")
async def get_patient_details(
    patient_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    role = current_user.get("role")
    target_id = patient_id.strip()

    if role == "patient":
        user_pat_id = current_user.get("patient_id")
        if not user_pat_id:
            pat = await db.patients.find_one({"user_id": str(current_user["_id"])})
            if pat:
                user_pat_id = pat.get("patient_id")
        if target_id != user_pat_id and target_id != "me":
            raise HTTPException(status_code=403, detail="Access denied: Cannot view other patients")
        target_id = user_pat_id

    raw = await db.patients.find_one({"patient_id": target_id})
    if not raw:
        # Check by _id fallback
        raw = await db.patients.find_one({"mrn": target_id})
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
    if "dob" in update_dict and update_dict["dob"] and "age" not in update_dict:
        update_dict["age"] = _calculate_age(update_dict["dob"])
    elif "age" in update_dict and update_dict["age"] is not None and ("dob" not in update_dict or not update_dict["dob"]):
        est_year = datetime.now(timezone.utc).year - update_dict["age"]
        update_dict["dob"] = f"{est_year}-01-01"
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
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Aggregates all chronological events for a patient:
    - Appointments (scheduled & completed)
    - Medical records (consultations, lab panels, ultrasounds)
    - Documents indexed
    - Follow-ups created and completed
    """
    role = current_user.get("role")
    target_id = patient_id.strip()

    if role == "patient":
        user_pat_id = current_user.get("patient_id")
        if not user_pat_id:
            pat = await db.patients.find_one({"user_id": str(current_user["_id"])})
            if pat:
                user_pat_id = pat.get("patient_id")
        if target_id != user_pat_id and target_id != "me":
            raise HTTPException(status_code=403, detail="Access denied")
        target_id = user_pat_id
    elif role not in ["doctor", "staff", "admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")

    events = []

    # 1. Medical records
    raw_recs = await db.medical_records.find({"patient_id": target_id}).to_list(100)
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
    raw_appts = await db.appointments.find({"patient_id": target_id}).to_list(50)
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
    doc_filter = {"patient_id": target_id}
    if role == "patient":
        doc_filter["approved_for_patient"] = True
    raw_docs = await db.documents.find(doc_filter).to_list(50)
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
    raw_fols = await db.followups.find({"patient_id": target_id}).to_list(50)
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
        "patient_id": target_id,
        "total_events": len(events),
        "events": events
    }
