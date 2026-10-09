from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class AuditLogModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    role: Optional[str] = None
    action: str  # login, login_failed, account_locked, document_upload, document_view, rag_query, record_create, etc.
    resource: str  # auth, patient, document, rag, record, appointment, etc.
    resource_id: Optional[str] = None
    ip_address: Optional[str] = None
    details: Dict[str, Any] = Field(default_factory=dict)

    model_config = {
        "populate_by_name": True,
        "json_encoders": {datetime: lambda v: v.isoformat()}
    }
