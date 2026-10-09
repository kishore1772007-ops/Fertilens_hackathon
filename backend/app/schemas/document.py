from typing import Optional, Any
from pydantic import BaseModel

class DocumentResponse(BaseModel):
    id: Optional[str] = None
    document_id: str
    patient_id: str
    uploaded_by: str
    uploader_name: Optional[str] = None
    title: str
    original_filename: str
    file_size_bytes: int
    mime_type: str
    status: str  # pending, processing, indexed, failed
    error_message: Optional[str] = None
    page_count: int = 0
    chunk_count: int = 0
    approved_for_patient: bool = False
    created_at: Optional[Any] = None

class DocumentApprovalUpdate(BaseModel):
    approved_for_patient: bool
