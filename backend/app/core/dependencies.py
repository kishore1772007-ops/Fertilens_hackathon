from typing import Optional, List, Callable
from fastapi import Request, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.database.mongodb import get_database
from app.core.security import decode_token, verify_csrf_protection
from app.repositories.user_repository import UserRepository

async def get_db() -> AsyncIOMotorDatabase:
    return get_database()

async def get_token_from_request(request: Request) -> str:
    """
    Extracts access token with priority:
    1. httpOnly cookie `access_token`
    2. `Authorization: Bearer <token>` header (fallback for testing/API clients)
    """
    cookie_token = request.cookies.get("access_token")
    if cookie_token:
        return cookie_token

    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header[7:].strip()

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated. Access token missing.",
        headers={"WWW-Authenticate": "Bearer"},
    )

async def get_current_user(
    request: Request,
    token: str = Depends(get_token_from_request),
    db: AsyncIOMotorDatabase = Depends(get_db)
) -> dict:
    """
    Validates token signature, expiration, type='access',
    and verifies that the user exists and is still active in the database.
    """
    payload = decode_token(token)

    token_type = payload.get("type")
    if token_type != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type for authorization",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing user identity claim",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with token does not exist",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )

    return user

def require_roles(*roles) -> Callable:
    """
    Factory dependency checking if the authenticated user has one of the allowed roles.
    Supports both require_roles("doctor", "staff") and require_roles(["doctor", "staff"]).
    """
    allowed_list = []
    for r in roles:
        if isinstance(r, (list, tuple, set)):
            allowed_list.extend(r)
        else:
            allowed_list.append(r)

    async def role_checker(current_user: dict = Depends(get_current_user)) -> dict:
        user_role = current_user.get("role")
        if user_role not in allowed_list:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires one of the following roles: {', '.join(allowed_list)}"
            )
        return current_user
    return role_checker

async def require_patient(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
) -> dict:
    """
    Ensures user is a patient, and resolves their verified patient_id from the database
    (not trusting any client query param or path param).
    Returns dict containing the user and their verified `patient_id` and `patient_doc`.
    """
    if current_user.get("role") != "patient":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Patient role required"
        )

    # 1. Check patient_id stored on user record
    patient_id = current_user.get("patient_id")

    # 2. If not directly on user record, lookup in patients collection by user_id
    patient_doc = None
    if patient_id:
        patient_doc = await db.patients.find_one({"patient_id": patient_id})
    if not patient_doc:
        patient_doc = await db.patients.find_one({"user_id": str(current_user["_id"])})

    if not patient_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient clinical profile not found for this user account"
        )

    from app.core.encryption import decrypt_doc
    patient_doc = decrypt_doc(patient_doc, "patients")
    current_user["verified_patient_id"] = patient_doc["patient_id"]
    current_user["patient_doc"] = patient_doc
    return current_user

async def csrf_protect(request: Request):
    """Dependency that enforces CSRF protection for state-changing requests."""
    verify_csrf_protection(request)
