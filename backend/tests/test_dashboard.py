import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from datetime import datetime, timezone
from mongomock_motor import AsyncMongoMockClient

from app.main import app
from app.core.security import get_password_hash, create_access_token
from app.core.encryption import encrypt_doc
from app.core.dependencies import get_db

@pytest.mark.asyncio
async def test_hospital_and_patient_dashboards():
    mock_client = AsyncMongoMockClient()
    mock_db = mock_client["test_dashboard_db"]

    # Override get_db dependency
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        now = datetime.now(timezone.utc)
        pw_hash = get_password_hash("Secret@123")

        # 1. Seed Doctor
        doc_res = await mock_db.users.insert_one({
            "email": "doctor@fertilens.ai",
            "password_hash": pw_hash,
            "full_name": "Dr. Sarah Rao",
            "role": "doctor",
            "is_active": True,
            "created_at": now
        })
        doc_id = str(doc_res.inserted_id)

        # 2. Seed Patient user & profile
        pat_user_res = await mock_db.users.insert_one({
            "email": "priya.demo@fertilens.ai",
            "password_hash": pw_hash,
            "full_name": "Priya Sharma",
            "role": "patient",
            "patient_id": "P1001",
            "is_active": True,
            "created_at": now
        })
        pat_user_id = str(pat_user_res.inserted_id)

        patient_profile = {
            "patient_id": "P1001",
            "user_id": pat_user_id,
            "mrn": "MRN-1001-PS",
            "first_name": "Priya",
            "last_name": "Sharma",
            "age": 31,
            "gender": "Female",
            "blood_type": "B+",
            "email": "priya.demo@fertilens.ai",
            "phone": "+91 98201 44211",
            "amh_level": 4.8,
            "fsh_level": 5.4,
            "antral_follicle_count": 24,
            "primary_diagnosis": "PCOS & Primary Infertility",
            "treatment_stage": "Ovulation Induction",
            "assigned_doctor_id": doc_id,
            "assigned_doctor_name": "Dr. Sarah Rao",
            "created_at": now,
            "updated_at": now
        }
        await mock_db.patients.insert_one(encrypt_doc(patient_profile, "patients"))

        # Seed appointment
        await mock_db.appointments.insert_one(encrypt_doc({
            "appointment_id": "APP-1001-1",
            "patient_id": "P1001",
            "doctor_id": doc_id,
            "title": "Follicular Monitoring",
            "start_time": now,
            "status": "scheduled",
            "notes": "Bring ultrasound records"
        }, "appointments"))

        # Seed followup
        await mock_db.followups.insert_one(encrypt_doc({
            "followup_id": "FOL-1001-1",
            "patient_id": "P1001",
            "title": "LH Surge Monitoring",
            "status": "pending",
            "due_date": now
        }, "followups"))

        # Seed document
        await mock_db.documents.insert_one(encrypt_doc({
            "document_id": "DOC-1001-APP",
            "patient_id": "P1001",
            "title": "Follicular Monitoring Report",
            "original_filename": "report.pdf",
            "status": "indexed",
            "approved_for_patient": True,
            "created_at": now
        }, "documents"))

        # Create JWT access tokens
        doc_token, _, _ = create_access_token(
            user_id=doc_id,
            role="doctor"
        )
        patient_token, _, _ = create_access_token(
            user_id=pat_user_id,
            role="patient",
            patient_id="P1001"
        )

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            # 1. Hospital staff accesses /api/v1/dashboard/hospital
            res_hosp = await ac.get(
                "/api/v1/dashboard/hospital",
                cookies={"access_token": doc_token}
            )
            assert res_hosp.status_code == 200
            hosp_data = res_hosp.json()
            assert hosp_data["stats"]["total_patients"] == 1
            assert hosp_data["stats"]["scheduled_appointments"] == 1
            assert hosp_data["stats"]["indexed_documents"] == 1
            assert len(hosp_data["recent_patients"]) == 1
            assert hosp_data["recent_patients"][0]["first_name"] == "Priya"  # Decrypted!

            # 2. Patient tries to access hospital dashboard -> Forbidden (403)
            res_hosp_pat = await ac.get(
                "/api/v1/dashboard/hospital",
                cookies={"access_token": patient_token}
            )
            assert res_hosp_pat.status_code == 403

            # 3. Patient accesses /api/v1/dashboard/patient
            res_pat = await ac.get(
                "/api/v1/dashboard/patient",
                cookies={"access_token": patient_token}
            )
            assert res_pat.status_code == 200
            pat_data = res_pat.json()
            assert pat_data["patient"]["patient_id"] == "P1001"
            assert pat_data["patient"]["first_name"] == "Priya"
            assert pat_data["next_appointment"]["title"] == "Follicular Monitoring"
            assert len(pat_data["approved_documents"]) == 1
            assert pat_data["approved_documents"][0]["document_id"] == "DOC-1001-APP"

            # 4. Doctor tries to access patient dashboard -> Forbidden (403)
            res_doc_pat = await ac.get(
                "/api/v1/dashboard/patient",
                cookies={"access_token": doc_token}
            )
            assert res_doc_pat.status_code == 403

    finally:
        app.dependency_overrides.clear()
