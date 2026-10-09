"""
Dashboard routes providing tailored clinical metrics for hospital staff
and personalized cycle progression data for patients.
"""
from datetime import datetime, timezone
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.dependencies import get_db, get_current_user, require_roles, require_patient
from app.core.encryption import decrypt_doc, decrypt_docs
from app.core.logging_config import logger

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

def _serialize_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    if not doc:
        return {}
    res = dict(doc)
    if "_id" in res:
        res["_id"] = str(res["_id"])
    return res

def _serialize_docs(docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return [_serialize_doc(d) for d in docs]

@router.get("/hospital", summary="Hospital Staff Clinical Dashboard Aggregation")
async def get_hospital_dashboard(
    current_user: dict = Depends(require_roles(["doctor", "staff", "admin"])),
    db: AsyncIOMotorDatabase = Depends(get_db)
) -> Dict[str, Any]:
    """
    Returns real-time KPIs and aggregated clinical metrics for hospital clinicians:
    - Active patient count
    - Total indexed documents
    - Scheduled appointments
    - Pending action items / follow-ups
    - Recent patient roster with decrypted clinical profiles
    - Upcoming consultations
    - High priority follow-up alerts
    """
    try:
        # 1. High-level metric counts
        total_patients = await db.patients.count_documents({})
        indexed_docs = await db.documents.count_documents({"status": "indexed"})
        scheduled_appts = await db.appointments.count_documents({"status": "scheduled"})
        pending_followups = await db.followups.count_documents({"status": "pending"})

        # 2. Patient roster (latest 10 active patients)
        raw_patients = await db.patients.find({}).sort("updated_at", -1).limit(10).to_list(10)
        decrypted_patients = [decrypt_doc(p, "patients") for p in raw_patients]
        recent_patients = _serialize_docs(decrypted_patients)

        # 3. Upcoming consultations (next 5 scheduled appointments)
        raw_appts = await db.appointments.find({"status": "scheduled"}).sort("start_time", 1).limit(5).to_list(5)
        decrypted_appts = [decrypt_doc(a, "appointments") for a in raw_appts]
        upcoming_appointments = _serialize_docs(decrypted_appts)

        # 4. Priority action items / pending follow-ups
        raw_fols = await db.followups.find({"status": "pending"}).sort("due_date", 1).limit(5).to_list(5)
        decrypted_fols = [decrypt_doc(f, "followups") for f in raw_fols]
        priority_followups = _serialize_docs(decrypted_fols)

        # 5. Recent documents
        raw_docs = await db.documents.find({}).sort("created_at", -1).limit(5).to_list(5)
        decrypted_docs = [decrypt_doc(d, "documents") for d in raw_docs]
        recent_documents = _serialize_docs(decrypted_docs)

        return {
            "stats": {
                "total_patients": total_patients,
                "indexed_documents": indexed_docs,
                "scheduled_appointments": scheduled_appts,
                "pending_followups": pending_followups
            },
            "recent_patients": recent_patients,
            "upcoming_appointments": upcoming_appointments,
            "priority_followups": priority_followups,
            "recent_documents": recent_documents,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    except Exception as e:
        logger.error(f"Failed to compile hospital dashboard: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error compiling hospital clinical dashboard metrics"
        )


@router.get("/patient", summary="Patient Personalized Care Dashboard")
async def get_patient_dashboard(
    patient_auth: dict = Depends(require_patient),
    db: AsyncIOMotorDatabase = Depends(get_db)
) -> Dict[str, Any]:
    """
    Returns personalized care summary for the authenticated patient:
    - Profile demographics & assigned physician
    - Next upcoming appointment
    - Active medications & treatment protocol
    - Pending self-action items or clinical instructions
    - Approved clinical documents & reports
    - Recent consultation notes
    """
    try:
        patient_id = patient_auth["verified_patient_id"]
        patient_profile = _serialize_doc(patient_auth["patient_doc"])

        # 1. Upcoming appointments for this patient
        raw_appts = await db.appointments.find({
            "patient_id": patient_id,
            "status": "scheduled"
        }).sort("start_time", 1).limit(5).to_list(5)
        upcoming_appointments = _serialize_docs([decrypt_doc(a, "appointments") for a in raw_appts])

        # 2. Pending follow-ups / tasks for this patient
        raw_fols = await db.followups.find({
            "patient_id": patient_id,
            "status": "pending"
        }).sort("due_date", 1).limit(5).to_list(5)
        pending_followups = _serialize_docs([decrypt_doc(f, "followups") for f in raw_fols])

        # 3. Approved clinical documents for this patient
        raw_docs = await db.documents.find({
            "patient_id": patient_id,
            "approved_for_patient": True
        }).sort("created_at", -1).limit(10).to_list(10)
        approved_documents = _serialize_docs([decrypt_doc(d, "documents") for d in raw_docs])

        # 4. Recent medical records (consultations, lab panels, ultrasounds)
        raw_records = await db.medical_records.find({
            "patient_id": patient_id
        }).sort("date", -1).limit(5).to_list(5)
        recent_records = _serialize_docs([decrypt_doc(r, "medical_records") for r in raw_records])

        # Identify next upcoming appointment
        next_appointment = upcoming_appointments[0] if upcoming_appointments else None

        return {
            "patient": patient_profile,
            "next_appointment": next_appointment,
            "upcoming_appointments": upcoming_appointments,
            "pending_followups": pending_followups,
            "approved_documents": approved_documents,
            "recent_records": recent_records,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    except Exception as e:
        logger.error(f"Failed to compile patient dashboard: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error compiling patient care dashboard"
        )
