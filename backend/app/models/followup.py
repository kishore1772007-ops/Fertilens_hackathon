from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class FollowUpModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    followup_id: str  # e.g., FOL-4001
    patient_id: str
    patient_name: Optional[str] = None
    created_by: str  # doctor/staff user_id
    creator_name: Optional[str] = None
    title: str
    description: str
    due_date: datetime
    status: str = "pending"  # pending, completed, overdue, waived
    priority: str = "medium"  # low, medium, high, urgent
    category: str = "Medication"  # Medication, Lab Work, Document Submission, Review
    resolution_notes: Optional[str] = None
    completed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "json_encoders": {datetime: lambda v: v.isoformat()}
    }
