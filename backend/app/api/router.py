from fastapi import APIRouter
from app.api.routes import (
    auth,
    audit,
    dashboard,
    documents,
    chat,
    patients,
    appointments,
    followups,
    pending,
    notifications
)

api_router = APIRouter()

# Register active routes
api_router.include_router(auth.router)
api_router.include_router(audit.router)
api_router.include_router(dashboard.router)
api_router.include_router(documents.router)
api_router.include_router(chat.router)
api_router.include_router(patients.router)
api_router.include_router(appointments.router)
api_router.include_router(followups.router)
api_router.include_router(pending.router)
api_router.include_router(notifications.router)
