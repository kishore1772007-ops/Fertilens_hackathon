from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.dependencies import get_db, require_roles
from app.database.repositories import BaseRepository

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])

@router.get("")
async def get_audit_logs(
    action: Optional[str] = Query(None, description="Filter by action name"),
    user_email: Optional[str] = Query(None, description="Filter by user email"),
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    current_user: dict = Depends(require_roles("admin")),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Retrieve audit logs (Read-only, Admin restricted).
    """
    query: Dict[str, Any] = {}
    if action:
        query["action"] = action
    if user_email:
        query["user_email"] = user_email

    cursor = db.audit_logs.find(query).sort("timestamp", -1).skip(skip).limit(limit)
    logs = await cursor.to_list(length=limit)
    total = await db.audit_logs.count_documents(query)

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "logs": BaseRepository.serialize_docs(logs)
    }
