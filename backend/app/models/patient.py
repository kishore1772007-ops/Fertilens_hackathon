from typing import Optional, List, Dict, Any
from datetime import datetime, date
from pydantic import BaseModel, Field, EmailStr

class PartnerInfo(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    medical_history: Optional[str] = None

class PatientModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    patient_id: str  # e.g., PAT-1001
    user_id: Optional[str] = None  # Linked user account if patient registered
    mrn: str  # Medical Record Number e.g., MRN-84729
    first_name: str
    last_name: str
    dob: str  # YYYY-MM-DD
    age: Optional[int] = None
    gender: str = "Female"
    blood_type: Optional[str] = "O+"
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None

    # Clinical fertility indicators
    amh_level: Optional[float] = None  # ng/mL
    fsh_level: Optional[float] = None  # mIU/mL
    antral_follicle_count: Optional[int] = None
    primary_diagnosis: Optional[str] = None  # e.g., Diminished Ovarian Reserve, PCOS, Tubal Factor
    treatment_stage: Optional[str] = "Initial Consultation"  # Ovarian Stimulation, Egg Retrieval, Embryo Transfer, Luteal Phase
    assigned_doctor_id: Optional[str] = None
    assigned_doctor_name: Optional[str] = None
    partner: Optional[PartnerInfo] = None
    status: str = "active"  # active, inactive, archived

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "json_encoders": {datetime: lambda v: v.isoformat()}
    }
