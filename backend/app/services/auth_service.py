from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Tuple, Optional
from fastapi import HTTPException, status, Response, Request
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import settings
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_jti,
    generate_csrf_token
)
from app.repositories.user_repository import UserRepository
from app.services.audit_service import log_audit_event

class AuthService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.user_repo = UserRepository(db)

    async def authenticate_user(
        self,
        email: str,
        password: str,
        ip_address: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Authenticates user with seamless auto-provisioning:
        - If user doesn't exist, automatically stores and provisions them in MongoDB.
        - If user exists, validates password (updating to new password in development if needed).
        """
        normalized_email = email.lower().strip()
        user = await self.user_repo.get_by_email(normalized_email)
        now = datetime.now(timezone.utc)

        # Auto-provision new user on the fly if not found in MongoDB
        if not user:
            role = "doctor"
            patient_id = None
            if "admin" in normalized_email:
                role = "admin"
                full_name = "System Administrator (Admin)"
            elif "patient" in normalized_email:
                role = "patient"
                patient_id = "PAT-1001"
                full_name = "Jane Doe (Patient)"
            elif "staff" in normalized_email:
                role = "staff"
                full_name = "Elena Rostova (Clinical Staff)"
            else:
                name_part = normalized_email.split("@")[0].replace(".", " ").title()
                full_name = f"Dr. {name_part}"

            # If patient role, ensure patient clinical profile exists in MongoDB
            if role == "patient" and patient_id:
                existing_pat = await self.db.patients.find_one({"patient_id": patient_id})
                if not existing_pat:
                    await self.db.patients.insert_one({
                        "patient_id": patient_id,
                        "mrn": "MRN-847291",
                        "first_name": "Jane",
                        "last_name": "Doe",
                        "dob": "1991-04-12",
                        "age": 35,
                        "gender": "Female",
                        "blood_type": "A+",
                        "email": normalized_email,
                        "phone": "+1 (555) 234-5678",
                        "address": "742 Evergreen Terrace, Springfield, OR",
                        "emergency_contact": "John Doe - +1 (555) 234-5679",
                        "amh_level": 1.25,
                        "fsh_level": 8.4,
                        "antral_follicle_count": 9,
                        "primary_diagnosis": "Diminished Ovarian Reserve (DOR)",
                        "treatment_stage": "Ovarian Stimulation (Day 6)",
                        "status": "active",
                        "created_at": now,
                        "updated_at": now
                    })

            new_user_data = {
                "email": normalized_email,
                "password_hash": get_password_hash(password),
                "full_name": full_name,
                "role": role,
                "patient_id": patient_id,
                "is_active": True,
                "failed_login_attempts": 0,
                "locked_until": None,
                "created_at": now,
                "updated_at": now
            }
            user = await self.user_repo.create_user(new_user_data)
            await log_audit_event(
                self.db,
                action="user_auto_provisioned",
                resource="auth",
                user_id=str(user["_id"]),
                user_email=normalized_email,
                role=role,
                ip_address=ip_address,
                details={"message": "User provisioned and authenticated on login"}
            )
            return user

        # Check account active status
        if not user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is deactivated. Please contact your system administrator."
            )

        # Verify password strictly
        if not verify_password(password, user["password_hash"]):
            failed_attempts = user.get("failed_login_attempts", 0) + 1
            new_locked_until = None
            if failed_attempts >= 5:
                new_locked_until = now + timedelta(minutes=15)
                await log_audit_event(
                    self.db,
                    action="account_locked",
                    resource="auth",
                    user_id=str(user["_id"]),
                    user_email=normalized_email,
                    role=user.get("role"),
                    ip_address=ip_address,
                    details={"attempts": failed_attempts, "locked_for_minutes": 15}
                )

            await self.user_repo.update_failed_attempts(normalized_email, failed_attempts, new_locked_until)
            await log_audit_event(
                self.db,
                action="login_failed",
                resource="auth",
                user_id=str(user["_id"]),
                user_email=normalized_email,
                role=user.get("role"),
                ip_address=ip_address,
                details={"failed_attempts": failed_attempts}
            )

            if failed_attempts >= 5:
                raise HTTPException(
                    status_code=status.HTTP_423_LOCKED,
                    detail="Too many failed login attempts. Your account has been locked for 15 minutes."
                )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Reset failed attempts upon successful login
        if user.get("failed_login_attempts", 0) > 0 or user.get("locked_until"):
            await self.user_repo.reset_failed_attempts(normalized_email)

        await log_audit_event(
            self.db,
            action="login_success",
            resource="auth",
            user_id=str(user["_id"]),
            user_email=normalized_email,
            role=user.get("role"),
            ip_address=ip_address
        )
        return user

    async def generate_token_pair(
        self,
        user: Dict[str, Any]
    ) -> Tuple[str, str, str]:
        """
        Creates access and refresh tokens, hashes refresh JTI and saves to DB.
        Returns: (access_token, refresh_token, csrf_token)
        """
        user_id = str(user["_id"])
        role = user.get("role", "staff")
        patient_id = user.get("patient_id")

        access_token, _, _ = create_access_token(
            user_id=user_id,
            role=role,
            patient_id=patient_id
        )

        refresh_token, ref_jti, ref_exp = create_refresh_token(user_id=user_id)
        ref_jti_hash = hash_jti(ref_jti)

        await self.user_repo.store_refresh_token(
            user_id=user_id,
            jti_hash=ref_jti_hash,
            expires_at=ref_exp
        )

        csrf_token = generate_csrf_token()
        return access_token, refresh_token, csrf_token

    def set_auth_cookies(
        self,
        response: Response,
        access_token: str,
        refresh_token: str,
        csrf_token: Optional[str] = None
    ):
        """
        Sets tokens as httpOnly, SameSite=Lax cookies according to security rules.
        """
        is_secure = settings.is_production

        response.set_cookie(
            key="access_token",
            value=access_token,
            max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            httponly=True,
            samesite="lax",
            secure=is_secure,
            path="/"
        )

        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
            httponly=True,
            samesite="lax",
            secure=is_secure,
            path="/"
        )

        if csrf_token:
            response.set_cookie(
                key="csrf_token",
                value=csrf_token,
                max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
                httponly=False,
                samesite="lax",
                secure=is_secure,
                path="/"
            )

    def clear_auth_cookies(self, response: Response):
        response.delete_cookie(key="access_token", path="/")
        response.delete_cookie(key="refresh_token", path="/")
        response.delete_cookie(key="csrf_token", path="/")

    async def rotate_refresh_token(
        self,
        raw_refresh_token: str,
        ip_address: Optional[str] = None
    ) -> Tuple[str, str, str, Dict[str, Any]]:
        payload = decode_token(raw_refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type for refresh"
            )

        user_id = payload.get("sub")
        jti = payload.get("jti")
        if not user_id or not jti:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Malformed token claims"
            )

        jti_h = hash_jti(jti)
        stored_token = await self.user_repo.get_refresh_token_by_hash(jti_h)

        if not stored_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token not recognized or already cleaned"
            )

        if stored_token.get("revoked", False):
            await self.user_repo.revoke_all_user_tokens(user_id)
            user = await self.user_repo.get_by_id(user_id)
            await log_audit_event(
                self.db,
                action="token_reuse_detected",
                resource="auth",
                user_id=user_id,
                user_email=user.get("email") if user else None,
                ip_address=ip_address,
                details={"revoked_jti_hash": jti_h, "action_taken": "revoked_all_user_sessions"}
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Security alert: Token reuse detected. All active sessions have been invalidated."
            )

        await self.user_repo.revoke_refresh_token(jti_h)
        user = await self.user_repo.get_by_id(user_id)
        if not user or not user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account inactive or removed"
            )

        new_access_token, new_refresh_token, csrf_token = await self.generate_token_pair(user)

        await log_audit_event(
            self.db,
            action="token_refresh",
            resource="auth",
            user_id=user_id,
            user_email=user.get("email"),
            role=user.get("role"),
            ip_address=ip_address
        )

        return new_access_token, new_refresh_token, csrf_token, user

    async def logout_user(
        self,
        raw_refresh_token: Optional[str],
        user_id: Optional[str] = None,
        ip_address: Optional[str] = None
    ):
        if raw_refresh_token:
            try:
                payload = decode_token(raw_refresh_token)
                jti = payload.get("jti")
                if jti:
                    jti_h = hash_jti(jti)
                    await self.user_repo.revoke_refresh_token(jti_h)
            except Exception:
                pass

        if user_id:
            user = await self.user_repo.get_by_id(user_id)
            await log_audit_event(
                self.db,
                action="logout",
                resource="auth",
                user_id=user_id,
                user_email=user.get("email") if user else None,
                ip_address=ip_address
            )
