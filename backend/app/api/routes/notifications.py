"""
Hospital alerts and notifications routes (Phase E).
"""
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database.mongodb import get_db
from app.core.dependencies import get_current_user
from app.core.encryption import encrypt_doc, decrypt_doc

router = APIRouter(prefix="/notifications", tags=["Notifications"])

def _serialize(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not doc:
        return None
    d = dict(doc)
    if "_id" in d:
        d["_id"] = str(d["_id"])
        d["id"] = d["_id"]
    return d

@router.get("", summary="Get notifications for current user")
async def list_notifications(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    user_id = str(current_user["_id"])
    raw_notifs = await db.notifications.find({"user_id": user_id}).sort("created_at", -1).to_list(50)
    
    # If no notifications exist, generate synthetic clinical alerts for demonstration
    if not raw_notifs:
        demo_notifs = [
            {
                "notification_id": f"NOTIF-{uuid.uuid4().hex[:6]}",
                "user_id": user_id,
                "title": "Follicular Monitoring Checkpoint",
                "message": "Priya Sharma (P1001) completed Cycle Day 10 Ultrasound. Leading follicle 15mm.",
                "type": "clinical_alert",
                "read": False,
                "created_at": datetime.now(timezone.utc)
            },
            {
                "notification_id": f"NOTIF-{uuid.uuid4().hex[:6]}",
                "user_id": user_id,
                "title": "Hormone Lab Panel Indexed",
                "message": "New endocrine panel automatically ingested for Ananya Roy (P1002).",
                "type": "system",
                "read": False,
                "created_at": datetime.now(timezone.utc)
            }
        ]
        for dn in demo_notifs:
            await db.notifications.insert_one(encrypt_doc(dn, "notifications"))
        raw_notifs = await db.notifications.find({"user_id": user_id}).sort("created_at", -1).to_list(50)

    decrypted = [_serialize(decrypt_doc(n, "notifications")) for n in raw_notifs]
    unread_count = sum(1 for n in decrypted if not n.get("read"))

    return {
        "unread_count": unread_count,
        "items": decrypted
    }

@router.put("/{notification_id}/read", summary="Mark notification as read")
async def mark_notification_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    await db.notifications.update_one(
        {"notification_id": notification_id.strip(), "user_id": str(current_user["_id"])},
        {"$set": {"read": True}}
    )
    return {"status": "success"}

@router.put("/read-all", summary="Mark all notifications as read")
async def mark_all_read(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    await db.notifications.update_many(
        {"user_id": str(current_user["_id"])},
        {"$set": {"read": True}}
    )
    return {"status": "success"}
