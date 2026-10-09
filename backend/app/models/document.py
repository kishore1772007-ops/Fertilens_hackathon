from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field

class DocumentModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    document_id: str  # e.g., DOC-7001
    patient_id: str
    uploaded_by: str  # user_id
    uploader_name: Optional[str] = None
    title: str
    original_filename: str
    stored_filepath: str
    file_size_bytes: int
    mime_type: str = "application/pdf"
    status: str = "pending"  # pending, processing, indexed, failed
    error_message: Optional[str] = None
    page_count: int = 0
    chunk_count: int = 0
    approved_for_patient: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "json_encoders": {datetime: lambda v: v.isoformat()}
    }

class DocumentChunkModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    chunk_id: str  # e.g., CHK-7001-1
    patient_id: str
    document_id: str
    document_title: str
    page_number: int
    chunk_index: int
    text: str
    embedding: List[float]  # 768 dimensions
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "json_encoders": {datetime: lambda v: v.isoformat()}
    }
