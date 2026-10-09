from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field

class MedicalRecordModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    record_id: str  # e.g., REC-5001
    patient_id: str
    doctor_id: Optional[str] = None
    doctor_name: Optional[str] = None
    record_type: str  # Consultation Note, Lab Result, Ultrasound, Embryology Report, Prescription, Surgical Note
    title: str
    date: datetime = Field(default_factory=datetime.utcnow)
    clinical_summary: str
    findings: Optional[str] = None
    plan: Optional[str] = None
    vitals: Optional[Dict[str, Any]] = None  # bp, weight, bmi, etc.
    tags: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "json_encoders": {datetime: lambda v: v.isoformat()}
    }
