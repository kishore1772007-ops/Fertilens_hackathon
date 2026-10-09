from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class AppointmentModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    appointment_id: str  # e.g., APP-3001
    patient_id: str
    patient_name: Optional[str] = None
    doctor_id: str
    doctor_name: Optional[str] = None
    title: str
    appointment_type: str  # Consultation, Ultrasound, Egg Retrieval, Embryo Transfer, Blood Test
    start_time: datetime
    end_time: datetime
    status: str = "scheduled"  # scheduled, completed, cancelled, in_progress
    notes: Optional[str] = None
    location: Optional[str] = "Main Fertility Suite 4B"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "json_encoders": {datetime: lambda v: v.isoformat()}
    }
