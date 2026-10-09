from typing import Optional, Dict, Any
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.logging_config import logger

async def log_audit_event(
    db: AsyncIOMotorDatabase,
    action: str,
    resource: str,
    user_id: Optional[str] = None,
    user_email: Optional[str] = None,
    role: Optional[str] = None,
    resource_id: Optional[str] = None,
    ip_address: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Persists an immutable audit log entry into the audit_logs collection.
    """
    event = {
        "timestamp": datetime.now(timezone.utc),
        "user_id": str(user_id) if user_id else None,
        "user_email": user_email,
        "role": role,
        "action": action,
        "resource": resource,
        "resource_id": str(resource_id) if resource_id else None,
        "ip_address": ip_address,
        "details": details or {}
    }
    try:
        result = await db.audit_logs.insert_one(event)
        event["_id"] = str(result.inserted_id)
        logger.info(f"[AUDIT] {action.upper()} on {resource}:{resource_id} by {user_email or 'anonymous'} ({role or 'none'})")
    except Exception as e:
        logger.error(f"Failed to record audit log: {e}")
    return event
