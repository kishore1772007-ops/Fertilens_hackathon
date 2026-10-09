from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field

class PartnerInfoSchema(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    medical_history: Optional[str] = None

class PatientCreate(BaseModel):
    first_name: str
    last_name: str
    dob: str
    gender: str = "Female"
    blood_type: Optional[str] = "O+"
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    amh_level: Optional[float] = None
    fsh_level: Optional[float] = None
    antral_follicle_count: Optional[int] = None
    primary_diagnosis: Optional[str] = None
    treatment_stage: Optional[str] = "Initial Consultation"
    assigned_doctor_id: Optional[str] = None
    partner: Optional[PartnerInfoSchema] = None

class PatientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    blood_type: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    amh_level: Optional[float] = None
    fsh_level: Optional[float] = None
    antral_follicle_count: Optional[int] = None
    primary_diagnosis: Optional[str] = None
    treatment_stage: Optional[str] = None
    assigned_doctor_id: Optional[str] = None
    partner: Optional[PartnerInfoSchema] = None
    status: Optional[str] = None

class PatientResponse(BaseModel):
    id: Optional[str] = None
    patient_id: str
    user_id: Optional[str] = None
    mrn: str
    first_name: str
    last_name: str
    dob: str
    age: Optional[int] = None
    gender: str
    blood_type: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    amh_level: Optional[float] = None
    fsh_level: Optional[float] = None
    antral_follicle_count: Optional[int] = None
    primary_diagnosis: Optional[str] = None
    treatment_stage: Optional[str] = None
    assigned_doctor_id: Optional[str] = None
    assigned_doctor_name: Optional[str] = None
    partner: Optional[PartnerInfoSchema] = None
    status: str
    created_at: Optional[Any] = None
    updated_at: Optional[Any] = None
