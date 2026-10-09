from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class MedicalRecordCreate(BaseModel):
    record_type: str  # Consultation Note, Lab Result, Ultrasound, Embryology Report, Prescription, Surgical Note
    title: str
    date: Optional[datetime] = None
    clinical_summary: str
    findings: Optional[str] = None
    plan: Optional[str] = None
    vitals: Optional[Dict[str, Any]] = None
    tags: List[str] = Field(default_factory=list)

class MedicalRecordResponse(BaseModel):
    id: Optional[str] = None
    record_id: str
    patient_id: str
    doctor_id: Optional[str] = None
    doctor_name: Optional[str] = None
    record_type: str
    title: str
    date: datetime
    clinical_summary: str
    findings: Optional[str] = None
    plan: Optional[str] = None
    vitals: Optional[Dict[str, Any]] = None
    tags: List[str] = Field(default_factory=list)
    created_at: Optional[Any] = None
