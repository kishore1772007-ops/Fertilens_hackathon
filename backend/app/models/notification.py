from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class NotificationModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    notification_id: str  # e.g., NOT-9001
    user_id: str
    title: str
    message: str
    notification_type: str = "info"  # info, alert, success, warning
    read: bool = False
    link: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "json_encoders": {datetime: lambda v: v.isoformat()}
    }
