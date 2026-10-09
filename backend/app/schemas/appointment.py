from typing import Optional, Any
from datetime import datetime
from pydantic import BaseModel

class AppointmentCreate(BaseModel):
    patient_id: str
    doctor_id: str
    title: str
    appointment_type: str
    start_time: datetime
    end_time: datetime
    notes: Optional[str] = None
    location: Optional[str] = "Main Fertility Suite 4B"

class AppointmentUpdate(BaseModel):
    title: Optional[str] = None
    appointment_type: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    location: Optional[str] = None

class AppointmentResponse(BaseModel):
    id: Optional[str] = None
    appointment_id: str
    patient_id: str
    patient_name: Optional[str] = None
    doctor_id: str
    doctor_name: Optional[str] = None
    title: str
    appointment_type: str
    start_time: datetime
    end_time: datetime
    status: str
    notes: Optional[str] = None
    location: Optional[str] = None
    created_at: Optional[Any] = None
