import hashlib
import uuid
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import jwt
from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher
from fastapi import Request, HTTPException, status
from app.core.config import settings

# Initialize password hasher using argon2
password_hash = PasswordHash((Argon2Hasher(),))

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return password_hash.verify(plain_password, hashed_password)
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    return password_hash.hash(password)

def hash_jti(jti: str) -> str:
    """Return SHA-256 hash of the JTI for secure database storage."""
    return hashlib.sha256(jti.encode("utf-8")).hexdigest()

def create_access_token(
    user_id: str,
    role: str,
    patient_id: Optional[str] = None,
    expires_delta: Optional[timedelta] = None
) -> tuple[str, str, datetime]:
    """
    Returns (token_string, jti, expires_at)
    """
    now = datetime.now(timezone.utc)
    if expires_delta:
        expires_at = now + expires_delta
    else:
        expires_at = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    jti = str(uuid.uuid4())
    payload: Dict[str, Any] = {
        "sub": str(user_id),
        "role": role,
        "type": "access",
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
        "jti": jti,
    }
    if role == "patient" and patient_id:
        payload["patient_id"] = str(patient_id)
        
    token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return token, jti, expires_at

def create_refresh_token(
    user_id: str,
    expires_delta: Optional[timedelta] = None
) -> tuple[str, str, datetime]:
    """
    Returns (token_string, jti, expires_at)
    """
    now = datetime.now(timezone.utc)
    if expires_delta:
        expires_at = now + expires_delta
    else:
        expires_at = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        
    jti = str(uuid.uuid4())
    payload: Dict[str, Any] = {
        "sub": str(user_id),
        "type": "refresh",
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
        "jti": jti,
    }
    token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return token, jti, expires_at

def decode_token(token: str) -> Dict[str, Any]:
    """Decodes and validates a JWT token signature and expiration."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def generate_csrf_token() -> str:
    """Generates a cryptographically random CSRF token."""
    return secrets.token_urlsafe(32)

def verify_csrf_protection(request: Request):
    """
    Verifies that state-changing requests have valid CSRF protection:
    Either X-Requested-With header equals 'XMLHttpRequest'
    Or X-CSRF-Token matches the csrf_token cookie.
    """
    # Safe methods do not require CSRF validation
    if request.method in ("GET", "HEAD", "OPTIONS"):
        return

    # Check for X-Requested-With header (standard CORS-preflighted / custom header defense)
    requested_with = request.headers.get("X-Requested-With")
    if requested_with and requested_with.lower() in ("xmlhttprequest", "fertilens-client"):
        return

    # Or double-submit CSRF token check
    csrf_header = request.headers.get("X-CSRF-Token")
    csrf_cookie = request.cookies.get("csrf_token")
    if csrf_header and csrf_cookie and secrets.compare_digest(csrf_header, csrf_cookie):
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="CSRF validation failed. Missing or invalid X-Requested-With header or CSRF token."
    )
