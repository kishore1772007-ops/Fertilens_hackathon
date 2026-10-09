from fastapi import APIRouter, Depends, Request, Response, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.dependencies import get_db, get_current_user, csrf_protect
from app.core.limiter import limiter
from app.schemas.auth import LoginRequest, TokenResponse, UserResponse
from app.services.auth_service import AuthService
from app.services.audit_service import log_audit_event
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/hospital/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def hospital_login(
    request: Request,
    response: Response,
    payload: LoginRequest,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Authenticate hospital personnel (Doctor, Staff, Admin).
    Rejects patients with standard generic 401 and logs 'wrong_portal_login'.
    """
    client_ip = request.client.host if request.client else "unknown"
    auth_service = AuthService(db)

    user = await auth_service.authenticate_user(
        email=payload.email,
        password=payload.password,
        ip_address=client_ip
    )

    allowed_roles = {"doctor", "staff", "admin"}
    if user.get("role") not in allowed_roles:
        await log_audit_event(
            db,
            action="wrong_portal_login",
            resource="auth",
            user_id=str(user["_id"]),
            user_email=user["email"],
            role=user.get("role"),
            ip_address=client_ip,
            details={"attempted_portal": "hospital", "reason": "Patient attempting hospital login"}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token, refresh_token, csrf_token = await auth_service.generate_token_pair(user)
    auth_service.set_auth_cookies(response, access_token, refresh_token, csrf_token)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user_id=str(user["_id"]),
        email=user["email"],
        full_name=user.get("full_name", ""),
        role=user.get("role", "doctor"),
        patient_id=user.get("patient_id")
    )

@router.post("/patient/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def patient_login(
    request: Request,
    response: Response,
    payload: LoginRequest,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Authenticate patient users.
    Rejects clinicians/staff with standard generic 401 and logs 'wrong_portal_login'.
    """
    client_ip = request.client.host if request.client else "unknown"
    auth_service = AuthService(db)

    user = await auth_service.authenticate_user(
        email=payload.email,
        password=payload.password,
        ip_address=client_ip
    )

    if user.get("role") != "patient":
        await log_audit_event(
            db,
            action="wrong_portal_login",
            resource="auth",
            user_id=str(user["_id"]),
            user_email=user["email"],
            role=user.get("role"),
            ip_address=client_ip,
            details={"attempted_portal": "patient", "reason": "Staff attempting patient login"}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token, refresh_token, csrf_token = await auth_service.generate_token_pair(user)
    auth_service.set_auth_cookies(response, access_token, refresh_token, csrf_token)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user_id=str(user["_id"]),
        email=user["email"],
        full_name=user.get("full_name", ""),
        role="patient",
        patient_id=user.get("patient_id")
    )

@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(
    request: Request,
    response: Response,
    payload: LoginRequest,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Legacy general login endpoint preserved for backward compatibility.
    """
    client_ip = request.client.host if request.client else "unknown"
    auth_service = AuthService(db)

    user = await auth_service.authenticate_user(
        email=payload.email,
        password=payload.password,
        ip_address=client_ip
    )

    access_token, refresh_token, csrf_token = await auth_service.generate_token_pair(user)
    auth_service.set_auth_cookies(response, access_token, refresh_token, csrf_token)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user_id=str(user["_id"]),
        email=user["email"],
        full_name=user.get("full_name", ""),
        role=user.get("role", "staff"),
        patient_id=user.get("patient_id")
    )

@router.post("/refresh")
async def refresh_tokens(
    request: Request,
    response: Response,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    raw_refresh_token = request.cookies.get("refresh_token")
    if not raw_refresh_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            raw_refresh_token = auth_header[7:].strip()

    if not raw_refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing"
        )

    client_ip = request.client.host if request.client else "unknown"
    auth_service = AuthService(db)

    new_access_token, new_refresh_token, csrf_token, user = await auth_service.rotate_refresh_token(
        raw_refresh_token=raw_refresh_token,
        ip_address=client_ip
    )

    auth_service.set_auth_cookies(response, new_access_token, new_refresh_token, csrf_token)

    return {
        "status": "success",
        "message": "Tokens successfully rotated",
        "access_token": new_access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "full_name": user.get("full_name", ""),
            "role": user.get("role"),
            "patient_id": user.get("patient_id")
        }
    }

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    created_at = current_user.get("created_at")
    created_at_str = created_at.isoformat() if hasattr(created_at, "isoformat") else str(created_at)

    return UserResponse(
        id=str(current_user["_id"]),
        email=current_user["email"],
        full_name=current_user.get("full_name", ""),
        role=current_user.get("role", "staff"),
        patient_id=current_user.get("patient_id"),
        is_active=current_user.get("is_active", True),
        created_at=created_at_str
    )

@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    raw_refresh_token = request.cookies.get("refresh_token")
    client_ip = request.client.host if request.client else "unknown"
    
    access_token = request.cookies.get("access_token")
    user_id = None
    if access_token:
        try:
            from app.core.security import decode_token
            payload = decode_token(access_token)
            user_id = payload.get("sub")
        except Exception:
            pass

    auth_service = AuthService(db)
    await auth_service.logout_user(raw_refresh_token, user_id=user_id, ip_address=client_ip)
    auth_service.clear_auth_cookies(response)

    return {"status": "success", "message": "Successfully logged out and session terminated"}
