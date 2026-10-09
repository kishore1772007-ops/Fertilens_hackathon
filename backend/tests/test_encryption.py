import os
import pytest
import pytest_asyncio
from mongomock_motor import AsyncMongoMockClient

from app.core.config import settings
from app.core.encryption import (
    encrypt_field,
    decrypt_field,
    compute_blind_index_token,
    generate_name_search_tokens,
    encrypt_doc,
    decrypt_doc,
    encrypt_file_bytes,
    decrypt_file_bytes,
    CIPHER_PREFIX,
    FILE_MAGIC_BYTES
)
from app.database.repositories import (
    BaseRepository,
    PatientRepository,
    MedicalRecordRepository
)

def test_field_encryption_roundtrip():
    plaintext = "Confidential Patient Diagnosis: Severe Diminished Ovarian Reserve"
    ciphertext = encrypt_field(plaintext)
    
    # Ciphertext must start with prefix
    assert ciphertext.startswith(CIPHER_PREFIX)
    assert ciphertext != plaintext

    # Decryption must return exact original plaintext
    decrypted = decrypt_field(ciphertext)
    assert decrypted == plaintext

def test_field_encryption_idempotence():
    plaintext = "Sample clinical note"
    c1 = encrypt_field(plaintext)
    c2 = encrypt_field(c1)
    assert c1 == c2  # Should not double-encrypt

def test_blind_index_deterministic():
    token1 = compute_blind_index_token("Priya")
    token2 = compute_blind_index_token("priya ")
    token3 = compute_blind_index_token("Ananya")

    # Normalized comparison
    assert token1 == token2
    assert token1 != token3
    assert len(token1) == 64  # SHA256 hex digest length

def test_name_search_tokens_generation():
    tokens = generate_name_search_tokens("Priya", "Sharma")
    assert len(tokens) >= 3
    # Check that individual and combined names are indexed
    assert compute_blind_index_token("priya") in tokens
    assert compute_blind_index_token("sharma") in tokens
    assert compute_blind_index_token("priya sharma") in tokens

def test_patient_doc_encryption():
    patient = {
        "patient_id": "P1001",
        "mrn": "MRN-1001",
        "first_name": "Priya",
        "last_name": "Sharma",
        "email": "priya.sharma@example.com",
        "phone": "+91 98201 44211",
        "age": 31,
        "amh_level": 4.8,
        "primary_diagnosis": "PCOS"
    }

    encrypted = encrypt_doc(patient, "patients")

    # Non-sensitive fields remain unchanged
    assert encrypted["patient_id"] == "P1001"
    assert encrypted["mrn"] == "MRN-1001"
    assert encrypted["age"] == 31
    assert encrypted["amh_level"] == 4.8

    # Sensitive fields are encrypted
    assert encrypted["first_name"].startswith(CIPHER_PREFIX)
    assert encrypted["last_name"].startswith(CIPHER_PREFIX)
    assert encrypted["email"].startswith(CIPHER_PREFIX)
    assert encrypted["phone"].startswith(CIPHER_PREFIX)
    assert encrypted["primary_diagnosis"].startswith(CIPHER_PREFIX)

    # Blind index tokens are present
    assert "name_search_tokens" in encrypted
    assert compute_blind_index_token("priya") in encrypted["name_search_tokens"]

    # Decryption recovers original document
    decrypted = decrypt_doc(encrypted, "patients")
    assert decrypted["first_name"] == "Priya"
    assert decrypted["last_name"] == "Sharma"
    assert decrypted["email"] == "priya.sharma@example.com"
    assert decrypted["primary_diagnosis"] == "PCOS"

def test_aes_gcm_file_encryption_roundtrip():
    pdf_payload = b"%PDF-1.4 Mock clinical ultrasound report binary content 1234567890"
    encrypted_bytes = encrypt_file_bytes(pdf_payload)

    # Verify header magic bytes
    assert encrypted_bytes.startswith(FILE_MAGIC_BYTES)
    assert encrypted_bytes != pdf_payload

    # Verify decryption
    decrypted_bytes = decrypt_file_bytes(encrypted_bytes)
    assert decrypted_bytes == pdf_payload

def test_file_decryption_fallback_for_unencrypted():
    raw_pdf = b"%PDF-1.4 raw unencrypted legacy pdf content"
    # Should safely return as-is
    res = decrypt_file_bytes(raw_pdf)
    assert res == raw_pdf

@pytest.mark.asyncio
async def test_repository_encryption_integration():
    client = AsyncMongoMockClient()
    db = client["test_encryption_db"]

    repo = PatientRepository(db)
    patient_doc = {
        "patient_id": "P9999",
        "mrn": "MRN-9999",
        "first_name": "Meera",
        "last_name": "Patel",
        "email": "meera.patel@test.com",
        "phone": "+91 99999 88888",
        "primary_diagnosis": "Tubal factor infertility",
        "amh_level": 2.1
    }

    # Insert via repository
    await repo.insert_one(patient_doc)

    # Check raw MongoDB collection: sensitive fields must be ciphertext
    raw_in_db = await db.patients.find_one({"patient_id": "P9999"})
    assert raw_in_db is not None
    assert raw_in_db["first_name"].startswith(CIPHER_PREFIX)
    assert raw_in_db["email"].startswith(CIPHER_PREFIX)
    assert "name_search_tokens" in raw_in_db

    # Query via repository: returned document must be decrypted plaintext
    retrieved = await repo.find_by_patient_id("P9999")
    assert retrieved is not None
    assert retrieved["first_name"] == "Meera"
    assert retrieved["last_name"] == "Patel"
    assert retrieved["email"] == "meera.patel@test.com"
    assert retrieved["primary_diagnosis"] == "Tubal factor infertility"

    # Search via blind index
    results = await repo.search_by_name("Meera")
    assert len(results) == 1
    assert results[0]["patient_id"] == "P9999"
    assert results[0]["first_name"] == "Meera"
