from typing import Optional, Any
from datetime import datetime
from pydantic import BaseModel

class FollowUpCreate(BaseModel):
    patient_id: str
    title: str
    description: str
    due_date: datetime
    priority: str = "medium"  # low, medium, high, urgent
    category: str = "Medication"

class FollowUpUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = None  # pending, completed, overdue, waived
    priority: Optional[str] = None
    category: Optional[str] = None
    resolution_notes: Optional[str] = None

class FollowUpResponse(BaseModel):
    id: Optional[str] = None
    followup_id: str
    patient_id: str
    patient_name: Optional[str] = None
    created_by: str
    creator_name: Optional[str] = None
    title: str
    description: str
    due_date: datetime
    status: str
    priority: str
    category: str
    resolution_notes: Optional[str] = None
    completed_at: Optional[datetime] = None
    created_at: Optional[Any] = None
