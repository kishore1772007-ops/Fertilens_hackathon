from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user_id: str
    email: str
    full_name: str
    role: str
    patient_id: Optional[str] = None

class RefreshTokenRequest(BaseModel):
    refresh_token: Optional[str] = None  # Typically received via httpOnly cookie

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: str
    patient_id: Optional[str] = None
    is_active: bool
    created_at: Optional[str] = None

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str
    role: str  # admin, doctor, staff, patient
    patient_id: Optional[str] = None
