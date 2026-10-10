"""
Clinical Chat Service managing session state, patient resolution, RAG retrieval,
medical records synthesis, and prompt injection defense.
"""
import uuid
import re
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.encryption import (
    encrypt_field,
    decrypt_field,
    decrypt_doc,
    compute_blind_index_token
)
from app.services.llm_service import llm_service
from app.services.audit_service import log_audit_event
from app.core.logging_config import logger

async def resolve_patient_for_query(
    db: AsyncIOMotorDatabase,
    user: Dict[str, Any],
    message: str,
    explicit_patient_id: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """
    Resolves patient record based on user role and message content:
    - If user is patient: strictly return their own record.
    - If user is clinician: check explicit_patient_id, scan for ID (P1001-P1007, PAT-xxx),
      check blind index tokens, or scan decrypted names.
    """
    user_role = user.get("role")

    # 1. Patient Role: strictly bound to own account
    if user_role == "patient":
        patient_id = user.get("patient_id")
        if not patient_id:
            pat = await db.patients.find_one({"user_id": str(user["_id"])})
            if pat:
                patient_id = pat.get("patient_id")
        if patient_id:
            raw = await db.patients.find_one({"patient_id": patient_id})
            return decrypt_doc(raw, "patients") if raw else None
        return None

    # 2. Clinician Role: check explicit ID first
    if explicit_patient_id and explicit_patient_id.strip():
        raw = await db.patients.find_one({"patient_id": explicit_patient_id.strip().upper()})
        if raw:
            return decrypt_doc(raw, "patients")

    # 3. Check for ID pattern (e.g. P1001-P1007, PAT-1001) in message
    id_match = re.search(r'\b(P\d{4}|PAT-\d+|MRN-[A-Za-z0-9-]+)\b', message, re.IGNORECASE)
    if id_match:
        found_id = id_match.group(1).upper()
        raw = await db.patients.find_one({
            "$or": [
                {"patient_id": found_id},
                {"mrn": found_id}
            ]
        })
        if raw:
            return decrypt_doc(raw, "patients")

    # 4. Check for patient names using blind index token search
    cleaned_msg = re.sub(r"['’]s\b", "", message, flags=re.IGNORECASE)
    words = [w.strip(".,!?:;\"'()[]{}").lower() for w in cleaned_msg.split()]
    for w in words:
        if len(w) >= 3:
            token = compute_blind_index_token(w)
            raw = await db.patients.find_one({"name_search_tokens": token})
            if raw:
                return decrypt_doc(raw, "patients")

    # 5. Fallback exhaustive name scan across patients
    all_raw_pats = await db.patients.find({}).to_list(50)
    for rp in all_raw_pats:
        dec = decrypt_doc(rp, "patients")
        first_name = (dec.get("first_name") or "").lower()
        last_name = (dec.get("last_name") or "").lower()
        full_name = f"{first_name} {last_name}".strip()
        
        if (first_name and first_name in cleaned_msg.lower()) or \
           (last_name and last_name in cleaned_msg.lower()) or \
           (full_name and full_name in cleaned_msg.lower()):
            return dec

    return None

async def handle_chat_message(
    db: AsyncIOMotorDatabase,
    user: Dict[str, Any],
    message: str,
    session_id: Optional[str] = None,
    explicit_patient_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Processes chat message:
    1. Resolve session & patient
    2. Retrieve relevant document chunks (RAG) + Medical Records + Uploaded Documents
    3. Call LLM Service
    4. Store encrypted messages
    5. Audit log
    """
    now = datetime.now(timezone.utc)
    user_role = user.get("role")
    is_patient_mode = (user_role == "patient")

    if not session_id:
        session_id = f"SESS-{uuid.uuid4().hex[:12]}"

    # Resolve patient context
    patient = await resolve_patient_for_query(db, user, message, explicit_patient_id)

    # Patient security boundary: if patient asks about someone else, prevent cross-patient leak
    if is_patient_mode:
        other_id_match = re.search(r'\bP\d{4}\b', message, re.IGNORECASE)
        if other_id_match and patient and other_id_match.group(0).upper() != patient.get("patient_id"):
            reply = (
                "🔒 **Security Boundary**: As a patient, you are only authorized to access your own "
                f"clinical records ({patient.get('patient_id')}). Inquiries regarding other patients are strictly restricted."
            )
            return {
                "session_id": session_id,
                "message_id": f"MSG-{uuid.uuid4().hex[:8]}",
                "reply": reply,
                "patient_id": patient.get("patient_id"),
                "sources": []
            }

    # Retrieve RAG chunks, Medical Records, and Uploaded Documents
    rag_chunks = []
    medical_records = []
    documents = []
    cohort_patients = []
    sources = []

    if patient:
        p_id = patient.get("patient_id")
        chunk_filter: Dict[str, Any] = {"patient_id": p_id}
        doc_filter: Dict[str, Any] = {"patient_id": p_id}
        if is_patient_mode:
            chunk_filter["approved_for_patient"] = True
            doc_filter["approved_for_patient"] = True

        # 1. RAG Vector chunks
        raw_chunks = await db.document_chunks.find(chunk_filter).limit(6).to_list(6)
        for rc in raw_chunks:
            decrypted_chunk = decrypt_doc(rc, "document_chunks")
            rag_chunks.append(decrypted_chunk)
            sources.append({
                "chunk_id": decrypted_chunk.get("chunk_id"),
                "document_title": decrypted_chunk.get("document_title"),
                "page_number": decrypted_chunk.get("page_number")
            })

        # 2. Medical Records (Lab panels, scans, consultations)
        raw_meds = await db.medical_records.find({"patient_id": p_id}).sort("date", -1).limit(10).to_list(10)
        for rm in raw_meds:
            medical_records.append(decrypt_doc(rm, "medical_records"))

        # 3. Uploaded Documents
        raw_docs = await db.documents.find(doc_filter).sort("created_at", -1).limit(10).to_list(10)
        for rd in raw_docs:
            dec_d = decrypt_doc(rd, "documents")
            documents.append(dec_d)
            if not any(s["document_title"] == dec_d.get("title") for s in sources):
                sources.append({
                    "chunk_id": dec_d.get("document_id"),
                    "document_title": dec_d.get("title"),
                    "page_number": dec_d.get("page_count", 1)
                })

        # 4. Scheduled Clinical Appointments
        raw_appts = await db.appointments.find({"patient_id": p_id}).sort("start_time", 1).limit(10).to_list(10)
        appointments = [decrypt_doc(a, "appointments") for a in raw_appts]

        # 5. Clinical Follow-ups & Medication Instructions
        raw_fols = await db.followups.find({"patient_id": p_id}).sort("due_date", 1).limit(10).to_list(10)
        followups = [decrypt_doc(f, "followups") for f in raw_fols]
    else:
        appointments = []
        followups = []
        # If no single patient resolved, load hospital cohort for broad clinical queries
        if not is_patient_mode:
            all_raw_pats = await db.patients.find({}).limit(20).to_list(20)
            cohort_patients = [decrypt_doc(p, "patients") for p in all_raw_pats]

    # Generate reply
    reply = await llm_service.generate_clinical_response(
        prompt=message,
        patient_context=patient,
        rag_chunks=rag_chunks,
        medical_records=medical_records,
        documents=documents,
        appointments=appointments,
        followups=followups,
        cohort_patients=cohort_patients,
        is_patient_mode=is_patient_mode
    )

    message_id = f"MSG-{uuid.uuid4().hex[:8]}"

    # Save session
    await db.chat_sessions.update_one(
        {"session_id": session_id},
        {
            "$set": {
                "session_id": session_id,
                "user_id": str(user["_id"]),
                "role": user_role,
                "patient_id": patient.get("patient_id") if patient else None,
                "updated_at": now
            },
            "$setOnInsert": {
                "created_at": now
            }
        },
        upsert=True
    )

    # Save messages (User + Assistant) with encrypted content
    user_msg_record = {
        "message_id": f"MSG-U-{uuid.uuid4().hex[:8]}",
        "session_id": session_id,
        "sender": "user",
        "role": user_role,
        "content": encrypt_field(message),
        "created_at": now
    }
    asst_msg_record = {
        "message_id": message_id,
        "session_id": session_id,
        "sender": "assistant",
        "role": "assistant",
        "content": encrypt_field(reply),
        "sources": sources,
        "created_at": now
    }

    await db.chat_messages.insert_many([user_msg_record, asst_msg_record])

    # Audit log
    await log_audit_event(
        db=db,
        user_id=str(user["_id"]),
        user_email=user.get("email"),
        role=user_role,
        action="chat_query",
        resource="chat_session",
        resource_id=session_id,
        details={
            "patient_id": patient.get("patient_id") if patient else None,
            "sources_count": len(sources)
        }
    )

    return {
        "session_id": session_id,
        "message_id": message_id,
        "reply": reply,
        "patient_id": patient.get("patient_id") if patient else None,
        "sources": sources
    }

async def get_session_history(
    db: AsyncIOMotorDatabase,
    session_id: str,
    user: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """Retrieves and decrypts messages for a chat session."""
    raw_msgs = await db.chat_messages.find({"session_id": session_id}).sort("created_at", 1).to_list(50)
    messages = []
    for m in raw_msgs:
        m["_id"] = str(m["_id"])
        m["content"] = decrypt_field(m.get("content"))
        messages.append(m)
    return messages
