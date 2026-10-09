from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

class UserModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    email: EmailStr
    password_hash: str
    full_name: str
    role: str  # admin, doctor, staff, patient
    patient_id: Optional[str] = None  # Populated for patient role
    is_active: bool = True
    failed_login_attempts: int = 0
    locked_until: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "json_encoders": {datetime: lambda v: v.isoformat()}
    }

class RefreshTokenModel(BaseModel):
    user_id: str
    jti_hash: str
    expires_at: datetime
    revoked: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
