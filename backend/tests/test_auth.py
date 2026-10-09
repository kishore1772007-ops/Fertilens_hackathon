import pytest
from datetime import timedelta, datetime, timezone
import jwt
from httpx import AsyncClient

from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token, get_password_hash, hash_jti
from app.database.mongodb import get_database

@pytest.mark.asyncio
async def test_hospital_login_success_and_cross_portal_rejection(client: AsyncClient):
    db = get_database()
    doc_email = "test.doc.login@hospital.com"
    pat_email = "test.pat.login@patient.com"
    await db.users.delete_many({"email": {"$in": [doc_email, pat_email]}})
    
    await db.users.insert_one({
        "email": doc_email,
        "password_hash": get_password_hash("DocPass123!"),
        "full_name": "Dr. Testing",
        "role": "doctor",
        "is_active": True,
        "created_at": datetime.now(timezone.utc)
    })
    await db.users.insert_one({
        "email": pat_email,
        "password_hash": get_password_hash("PatPass123!"),
        "full_name": "Jane Patient",
        "role": "patient",
        "patient_id": "PAT-TEST-1",
        "is_active": True,
        "created_at": datetime.now(timezone.utc)
    })

    # 1. Doctor logs into hospital portal -> 200 OK
    res_doc = await client.post(
        "/api/v1/auth/hospital/login",
        json={"email": doc_email, "password": "DocPass123!"}
    )
    assert res_doc.status_code == 200
    assert res_doc.json()["role"] == "doctor"

    # 2. Patient tries to log into hospital portal -> 401 generic rejection
    res_pat_wrong = await client.post(
        "/api/v1/auth/hospital/login",
        json={"email": pat_email, "password": "PatPass123!"}
    )
    assert res_pat_wrong.status_code == 401
    assert "Invalid email or password" in res_pat_wrong.json()["detail"]

    # 3. Patient logs into patient portal -> 200 OK
    res_pat = await client.post(
        "/api/v1/auth/patient/login",
        json={"email": pat_email, "password": "PatPass123!"}
    )
    assert res_pat.status_code == 200
    assert res_pat.json()["role"] == "patient"

    # 4. Doctor tries to log into patient portal -> 401 generic rejection
    res_doc_wrong = await client.post(
        "/api/v1/auth/patient/login",
        json={"email": doc_email, "password": "DocPass123!"}
    )
    assert res_doc_wrong.status_code == 401
    assert "Invalid email or password" in res_doc_wrong.json()["detail"]

@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    db = get_database()
    test_email = "wrong_pass_user@test.com"
    await db.users.delete_many({"email": test_email})
    await db.users.insert_one({
        "email": test_email,
        "password_hash": get_password_hash("CorrectPassword123!"),
        "full_name": "Test User",
        "role": "doctor",
        "is_active": True,
        "failed_login_attempts": 0,
        "locked_until": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    })

    response = await client.post(
        "/api/v1/auth/login",
        json={"email": test_email, "password": "WrongPassword999!"}
    )
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]

@pytest.mark.asyncio
async def test_inactive_user_cannot_login(client: AsyncClient):
    db = get_database()
    test_email = "deactivated@test.com"
    await db.users.delete_many({"email": test_email})
    await db.users.insert_one({
        "email": test_email,
        "password_hash": get_password_hash("Password123!"),
        "full_name": "Inactive Doctor",
        "role": "doctor",
        "is_active": False,
        "failed_login_attempts": 0,
        "locked_until": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    })

    response = await client.post(
        "/api/v1/auth/hospital/login",
        json={"email": test_email, "password": "Password123!"}
    )
    assert response.status_code == 403
    assert "deactivated" in response.json()["detail"].lower()

@pytest.mark.asyncio
async def test_expired_token(client: AsyncClient):
    db = get_database()
    test_email = "expired_token_user@test.com"
    await db.users.delete_many({"email": test_email})
    res = await db.users.insert_one({
        "email": test_email,
        "password_hash": get_password_hash("Password123!"),
        "full_name": "Expired Tester",
        "role": "doctor",
        "is_active": True,
        "created_at": datetime.now(timezone.utc)
    })
    user_id = str(res.inserted_id)

    expired_token, _, _ = create_access_token(
        user_id=user_id,
        role="doctor",
        expires_delta=timedelta(seconds=-10)
    )

    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {expired_token}"}
    )
    assert response.status_code == 401
    assert "expired" in response.json()["detail"].lower()

@pytest.mark.asyncio
async def test_tampered_token(client: AsyncClient):
    db = get_database()
    test_email = "tampered_user@test.com"
    await db.users.delete_many({"email": test_email})
    res = await db.users.insert_one({
        "email": test_email,
        "password_hash": get_password_hash("Password123!"),
        "full_name": "Tamper Tester",
        "role": "doctor",
        "is_active": True,
        "created_at": datetime.now(timezone.utc)
    })
    user_id = str(res.inserted_id)

    valid_token, _, _ = create_access_token(user_id=user_id, role="doctor")
    tampered_token = valid_token[:-6] + "xxxxxx"

    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {tampered_token}"}
    )
    assert response.status_code == 401
    assert "invalid token" in response.json()["detail"].lower()

@pytest.mark.asyncio
async def test_refresh_rotation_and_reuse_detection(client: AsyncClient):
    db = get_database()
    test_email = "rotation_user@test.com"
    await db.users.delete_many({"email": test_email})
    user_res = await db.users.insert_one({
        "email": test_email,
        "password_hash": get_password_hash("Password123!"),
        "full_name": "Rotation Tester",
        "role": "staff",
        "is_active": True,
        "created_at": datetime.now(timezone.utc)
    })
    user_id = str(user_res.inserted_id)

    login_resp = await client.post(
        "/api/v1/auth/hospital/login",
        json={"email": test_email, "password": "Password123!"}
    )
    assert login_resp.status_code == 200
    cookies = login_resp.cookies
    initial_refresh_token = cookies.get("refresh_token")
    assert initial_refresh_token is not None

    refresh_resp = await client.post(
        "/api/v1/auth/refresh",
        cookies={"refresh_token": initial_refresh_token}
    )
    assert refresh_resp.status_code == 200
    rotated_data = refresh_resp.json()
    assert rotated_data["status"] == "success"

    new_refresh_token = refresh_resp.cookies.get("refresh_token")
    assert new_refresh_token is not None
    assert new_refresh_token != initial_refresh_token

    # Present old token -> triggers reuse alert
    reuse_resp = await client.post(
        "/api/v1/auth/refresh",
        cookies={"refresh_token": initial_refresh_token}
    )
    assert reuse_resp.status_code == 401
    assert "token reuse detected" in reuse_resp.json()["detail"].lower()

@pytest.mark.asyncio
async def test_role_denial(client: AsyncClient):
    db = get_database()
    test_email = "patient_role_test@test.com"
    await db.users.delete_many({"email": test_email})
    user_res = await db.users.insert_one({
        "email": test_email,
        "password_hash": get_password_hash("Password123!"),
        "full_name": "Patient Role Tester",
        "role": "patient",
        "patient_id": "PAT-9999",
        "is_active": True,
        "created_at": datetime.now(timezone.utc)
    })
    user_id = str(user_res.inserted_id)

    patient_token, _, _ = create_access_token(user_id=user_id, role="patient", patient_id="PAT-9999")

    response = await client.get(
        "/api/v1/audit-logs",
        headers={"Authorization": f"Bearer {patient_token}"}
    )
    assert response.status_code == 403
    assert "access forbidden" in response.json()["detail"].lower()
