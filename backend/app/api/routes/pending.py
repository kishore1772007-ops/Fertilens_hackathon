"""
Pending information & clinical action items queue routes (Phase E).
"""
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database.mongodb import get_db
from app.core.dependencies import require_roles
from app.core.encryption import decrypt_doc

router = APIRouter(prefix="/pending", tags=["Pending Items"])

@router.get("", summary="Get pending information items queue")
async def get_pending_queue(
    current_user: dict = Depends(require_roles(["doctor", "staff", "admin"])),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Returns pending items requiring clinical team action:
    - Pending lab reviews
    - Medication administration checkpoints
    - Consent and ultrasound followups
    """
    raw_fols = await db.followups.find({"status": "pending"}).sort("due_date", 1).to_list(100)
    pending_items = []

    for f in raw_fols:
        dec = decrypt_doc(f, "followups")
        pending_items.append({
            "id": dec.get("followup_id"),
            "patient_id": dec.get("patient_id"),
            "patient_name": dec.get("patient_name"),
            "title": dec.get("title"),
            "description": dec.get("description"),
            "category": dec.get("category", "Review"),
            "priority": dec.get("priority", "medium"),
            "due_date": dec.get("due_date"),
            "status": dec.get("status")
        })

    return {
        "total_pending": len(pending_items),
        "items": pending_items
    }
