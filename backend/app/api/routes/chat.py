"""
Chat endpoints providing real-time AI clinical assistance for clinicians and patients.
"""
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.dependencies import get_db, get_current_user
from app.services.chat_service import handle_chat_message, get_session_history
from app.core.logging_config import logger

router = APIRouter(prefix="/chat", tags=["Chatbot"])

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    session_id: Optional[str] = None
    patient_id: Optional[str] = None

class SourceItem(BaseModel):
    chunk_id: Optional[str] = None
    document_title: Optional[str] = None
    page_number: Optional[int] = None

class ChatResponse(BaseModel):
    session_id: str
    message_id: str
    reply: str
    patient_id: Optional[str] = None
    sources: List[SourceItem] = []

@router.post("/message", response_model=ChatResponse, summary="Send message to FertiLens AI Assistant")
async def send_chat_message(
    payload: ChatRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Submits a message to the AI clinical assistant:
    - Resolves patient context via RAG
    - Applies role-based security boundaries
    - Defends against prompt injection
    - Encrypts and persists message history
    """
    try:
        result = await handle_chat_message(
            db=db,
            user=current_user,
            message=payload.message,
            session_id=payload.session_id,
            explicit_patient_id=payload.patient_id
        )
        return result
    except Exception as e:
        logger.error(f"Error handling chat message: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error generating AI clinical synthesis"
        )

@router.get("/history", summary="Fetch session chat history")
async def get_chat_history(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Retrieves decrypted chat message history for a session."""
    try:
        messages = await get_session_history(db=db, session_id=session_id, user=current_user)
        return {"session_id": session_id, "messages": messages}
    except Exception as e:
        logger.error(f"Error retrieving chat history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving session history"
        )
