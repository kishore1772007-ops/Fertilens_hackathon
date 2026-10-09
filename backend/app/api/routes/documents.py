"""
Document management and authorized streaming routes with AES-256-GCM file decryption.
"""
import os
from fastapi import APIRouter, Depends, HTTPException, status, Response
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.dependencies import get_db, get_current_user
from app.core.encryption import decrypt_doc, decrypt_file_bytes
from app.services.audit_service import log_audit_event
from app.core.logging_config import logger

router = APIRouter(prefix="/documents", tags=["Documents"])

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
            # Check if linked via user_id
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
