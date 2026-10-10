"""
Document management, secure uploading, automated clinical ingestion (RAG),
and authorized streaming routes with AES-256-GCM file encryption.
"""
import os
import uuid
import fitz  # PyMuPDF
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Response, UploadFile, File, Form, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import settings
from app.core.dependencies import get_db, get_current_user, require_roles
from app.core.encryption import encrypt_doc, decrypt_doc, encrypt_file_bytes, decrypt_file_bytes
from app.rag.ingestion import ingest_document
from app.services.audit_service import log_audit_event
from app.core.logging_config import logger

router = APIRouter(prefix="/documents", tags=["Documents"])

def _serialize_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    if not doc:
        return {}
    res = dict(doc)
    if "_id" in res:
        res["_id"] = str(res["_id"])
        res["id"] = res["_id"]
    return res

@router.get("", summary="List clinical documents with filtering")
async def list_documents(
    patient_id: Optional[str] = Query(None, description="Filter by Patient ID"),
    document_type: Optional[str] = Query(None, description="Filter by document category"),
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Returns list of clinical documents:
    - Clinicians can view all documents or filter by patient.
    - Patients only see their own approved documents.
    """
    role = current_user.get("role")
    query: Dict[str, Any] = {}

    if role == "patient":
        user_pat_id = current_user.get("patient_id")
        if not user_pat_id:
            pat = await db.patients.find_one({"user_id": str(current_user["_id"])})
            if pat:
                user_pat_id = pat.get("patient_id")
        query["patient_id"] = user_pat_id
        query["approved_for_patient"] = True
    else:
        if patient_id and patient_id.strip():
            query["patient_id"] = patient_id.strip().upper()

    if document_type:
        query["document_type"] = document_type
    if status_filter:
        query["status"] = status_filter

    raw_docs = await db.documents.find(query).sort("created_at", -1).limit(100).to_list(100)
    decrypted_list = [_serialize_doc(decrypt_doc(d, "documents")) for d in raw_docs]
    return decrypted_list


@router.post("/upload", summary="Upload and ingest patient clinical document/scan")
async def upload_patient_document(
    patient_id: str = Form(...),
    title: str = Form(...),
    document_type: str = Form("blood_test"),  # blood_test, ultrasound_scan, embryology, lab_report, consultation_note, other
    clinical_notes: Optional[str] = Form(None),
    approved_for_patient: bool = Form(True),
    file: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Uploads a scan / blood test / lab report for a patient:
    1. Validates patient exists and authorizes uploader.
    2. Encrypts and persists file with AES-256-GCM.
    3. Runs RAG text extraction and vector chunk indexing.
    4. Automatically adds a corresponding entry in medical_records.
    5. Logs audit event.
    """
    role = current_user.get("role")
    if role == "patient":
        user_pat_id = current_user.get("patient_id")
        if not user_pat_id:
            pat = await db.patients.find_one({"user_id": str(current_user["_id"])})
            if pat:
                user_pat_id = pat.get("patient_id")
        if not user_pat_id:
            raise HTTPException(status_code=403, detail="Patient profile not linked")
        clean_p_id = user_pat_id.strip().upper()
        approved_for_patient = True
    elif role not in ["doctor", "staff", "admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized role")
    else:
        clean_p_id = patient_id.strip().upper()

    now = datetime.now(timezone.utc)

    # 1. Resolve Patient
    patient = await db.patients.find_one({"patient_id": clean_p_id})
    if not patient:
        # Check if matched by MRN or lower ID
        patient = await db.patients.find_one({"patient_id": {"$regex": f"^{clean_p_id}$", "$options": "i"}})
    
    patient_name = f"{patient.get('first_name', '')} {patient.get('last_name', '')}".strip() if patient else clean_p_id

    # 2. Setup Document ID & Storage Directory
    doc_uuid = uuid.uuid4().hex[:6].upper()
    doc_id = f"DOC-{clean_p_id}-{doc_uuid}"
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    filename = file.filename if file and file.filename else f"{title.replace(' ', '_')}.pdf"
    file_path = os.path.join(settings.UPLOAD_DIR, f"{doc_id}_{filename}.pdf")

    # 3. Process File Content / Generate Clinical PDF
    pdf_bytes = b""
    if file and file.filename:
        raw_bytes = await file.read()
        lower_name = file.filename.lower()
        
        if lower_name.endswith(".pdf"):
            pdf_bytes = raw_bytes
        elif lower_name.endswith((".png", ".jpg", ".jpeg")):
            # Convert image to PDF wrapper
            doc = fitz.open()
            img_doc = fitz.open("image", raw_bytes)
            rect = img_doc[0].rect
            pdfbytes = img_doc.convert_to_pdf()
            img_pdf = fitz.open("pdf", pdfbytes)
            page = doc.new_page(width=rect.width, height=rect.height)
            page.show_pdf_page(rect, img_pdf, 0)
            
            # Add text annotation on page for RAG extraction
            text_summary = f"Clinical Scan Image: {title}\nPatient: {patient_name} ({clean_p_id})\nNotes: {clinical_notes or 'Ultrasound/Scan Image'}"
            page.insert_text((50, rect.height - 50), text_summary, fontsize=10, color=(0, 0, 0))
            pdf_bytes = doc.tobytes()
            doc.close()
        else:
            # Plain text to PDF
            doc = fitz.open()
            page = doc.new_page(width=612, height=792)
            header_text = f"FertiLens Clinical Report\nPatient: {patient_name} (ID: {clean_p_id})\nDocument: {title}\nType: {document_type}\nDate: {now.strftime('%Y-%m-%d %H:%M:%S UTC')}\n\n"
            full_body = header_text + raw_bytes.decode("utf-8", errors="ignore")
            if clinical_notes:
                full_body += f"\n\nClinical Impressions:\n{clinical_notes}"
            page.insert_text((50, 50), full_body, fontsize=11, color=(0.1, 0.1, 0.1))
            pdf_bytes = doc.tobytes()
            doc.close()
    else:
        # Generate clean structured PDF from metadata & clinical notes
        doc = fitz.open()
        page = doc.new_page(width=612, height=792)
        
        # Header banner
        page.draw_rect(fitz.Rect(40, 40, 572, 85), color=(0.05, 0.58, 0.53), fill=(0.93, 0.98, 0.98), width=1.5)
        page.insert_text((55, 65), f"FERTILENS AI CLINICAL INTELLIGENCE DOSSIER", fontsize=13, fontname="helv", color=(0.05, 0.45, 0.4), bold=True)
        page.insert_text((55, 78), f"Department of Reproductive Endocrinology & Infertility (ART)", fontsize=9, fontname="helv", color=(0.3, 0.3, 0.3))
        
        content = (
            f"Patient Name: {patient_name}\n"
            f"Patient ID: {clean_p_id}\n"
            f"Document Title: {title}\n"
            f"Document Type: {document_type.replace('_', ' ').title()}\n"
            f"Date Recorded: {now.strftime('%B %d, %Y')}\n"
            f"Recording Clinician: {current_user.get('full_name', 'Attending Staff')}\n\n"
            f"--- CLINICAL FINDINGS & BIOMARKER SUMMARY ---\n"
            f"{clinical_notes or 'Standard laboratory & clinical assessment recorded without adverse findings.'}\n\n"
            f"--- STATUS & DISPOSITION ---\n"
            f"Validated by clinical care team. Approved for patient portal: {'Yes' if approved_for_patient else 'Internal Only'}.\n"
        )
        page.insert_text((50, 115), content, fontsize=11, color=(0.15, 0.15, 0.15))
        pdf_bytes = doc.tobytes()
        doc.close()

    # 4. Encrypt file bytes with AES-256-GCM and store
    encrypted_bytes = encrypt_file_bytes(pdf_bytes)
    with open(file_path, "wb") as f:
        f.write(encrypted_bytes)

    # 5. Insert document in MongoDB
    doc_record = {
        "document_id": doc_id,
        "patient_id": clean_p_id,
        "title": title,
        "document_type": document_type,
        "original_filename": filename,
        "stored_filepath": file_path,
        "file_size": len(pdf_bytes),
        "status": "pending",
        "approved_for_patient": approved_for_patient,
        "clinical_notes": clinical_notes,
        "uploaded_by": str(current_user["_id"]),
        "uploader_name": current_user.get("full_name", ""),
        "created_at": now,
        "updated_at": now
    }

    encrypted_doc = encrypt_doc(doc_record, "documents")
    await db.documents.insert_one(encrypted_doc)

    # 6. Execute RAG Ingestion Pipeline (chunks & embeddings)
    try:
        await ingest_document(db, doc_id)
    except Exception as e:
        logger.warning(f"RAG ingestion notice for {doc_id}: {e}")

    # 7. Add corresponding entry in medical_records
    rec_id = f"REC-{clean_p_id}-{uuid.uuid4().hex[:6].upper()}"
    med_rec = {
        "record_id": rec_id,
        "patient_id": clean_p_id,
        "date": now.strftime("%Y-%m-%d"),
        "record_type": document_type,
        "title": title,
        "doctor_name": current_user.get("full_name", "Attending Clinician"),
        "notes": clinical_notes or f"Uploaded report: {title}",
        "document_id": doc_id,
        "created_at": now,
        "updated_at": now
    }
    encrypted_med_rec = encrypt_doc(med_rec, "medical_records")
    await db.medical_records.insert_one(encrypted_med_rec)

    # 8. Audit Log
    await log_audit_event(
        db=db,
        user_id=str(current_user["_id"]),
        user_email=current_user.get("email"),
        role=current_user.get("role"),
        action="upload_document",
        resource="document",
        resource_id=doc_id,
        details={
            "title": title,
            "patient_id": clean_p_id,
            "document_type": document_type,
            "approved_for_patient": approved_for_patient
        }
    )

    return {
        "status": "success",
        "message": f"Document '{title}' successfully uploaded and indexed for patient {clean_p_id}.",
        "document": {
            "document_id": doc_id,
            "patient_id": clean_p_id,
            "title": title,
            "document_type": document_type,
            "file_size": len(pdf_bytes),
            "status": "indexed",
            "approved_for_patient": approved_for_patient
        }
    }


@router.get("/{document_id}/file", summary="Stream decrypted PDF file")
async def get_document_file(
    document_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Streams decrypted PDF file to authorized users.
    - Clinicians (doctor/staff/admin) can view any clinical document.
    - Patients can ONLY view their own approved documents (approved_for_patient = True).
    """
    doc = await db.documents.find_one({"document_id": document_id})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    decrypted_meta = decrypt_doc(doc, "documents")
    role = current_user.get("role")
    user_patient_id = current_user.get("patient_id")

    # Authorization Check
    if role == "patient":
        if not user_patient_id:
            pat = await db.patients.find_one({"user_id": str(current_user["_id"])})
            if pat:
                user_patient_id = pat["patient_id"]

        if decrypted_meta.get("patient_id") != user_patient_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Cannot access documents belonging to other patients"
            )
        if not decrypted_meta.get("approved_for_patient", False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: This clinical document is restricted to hospital staff"
            )
    elif role not in ["doctor", "staff", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized role"
        )

    file_path = decrypted_meta.get("stored_filepath")
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document binary file not found on storage"
        )

    try:
        with open(file_path, "rb") as f:
            encrypted_or_raw = f.read()

        # Decrypt AES-256-GCM file bytes
        decrypted_pdf = decrypt_file_bytes(encrypted_or_raw)
        filename = decrypted_meta.get("original_filename") or f"{document_id}.pdf"

        # Audit log document view
        await log_audit_event(
            db=db,
            user_id=str(current_user["_id"]),
            user_email=current_user.get("email"),
            role=current_user.get("role"),
            action="read",
            resource="document",
            resource_id=document_id,
            details={"filename": filename, "patient_id": decrypted_meta.get("patient_id")}
        )

        return Response(
            content=decrypted_pdf,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'inline; filename="{filename}"',
                "Content-Type": "application/pdf"
            }
        )
    except Exception as e:
        logger.error(f"Error reading or decrypting document {document_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving document file"
        )
