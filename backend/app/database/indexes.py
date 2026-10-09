import pymongo
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.logging_config import logger

async def create_indexes(db: AsyncIOMotorDatabase):
    """
    Creates standard indexes across all FertiLens collections:
    - users: unique email
    - refresh_tokens: unique jti_hash, TTL on expires_at, user_id index
    - patients: unique patient_id, unique mrn, index on user_id, email, full_name
    - medical_records: index on patient_id, record_id
    - documents: unique document_id, index on patient_id, status
    - document_chunks: unique chunk_id, compound index on (patient_id, document_id)
    - appointments: index on appointment_id, patient_id, doctor_id, start_time
    - followups: index on followup_id, patient_id, status, due_date
    - notifications: index on user_id, read, created_at
    - chat_sessions: index on session_id, patient_id
    - chat_messages: index on session_id, created_at
    - audit_logs: index on timestamp (descending), user_id, action, resource
    """
    logger.info("Initializing MongoDB indexes...")

    try:
        # Users collection
        await db.users.create_index([("email", pymongo.ASCENDING)], unique=True)
        await db.users.create_index([("role", pymongo.ASCENDING)])
        await db.users.create_index([("patient_id", pymongo.ASCENDING)])

        # Refresh tokens collection with TTL index
        await db.refresh_tokens.create_index([("jti_hash", pymongo.ASCENDING)], unique=True)
        await db.refresh_tokens.create_index([("user_id", pymongo.ASCENDING)])
        # TTL index: documents automatically expire when expires_at timestamp is reached
        await db.refresh_tokens.create_index([("expires_at", pymongo.ASCENDING)], expireAfterSeconds=0)

        # Patients collection
        await db.patients.create_index([("patient_id", pymongo.ASCENDING)], unique=True)
        await db.patients.create_index([("mrn", pymongo.ASCENDING)], unique=True)
        await db.patients.create_index([("user_id", pymongo.ASCENDING)])
        await db.patients.create_index([("email", pymongo.ASCENDING)])
        await db.patients.create_index([("name_search_tokens", pymongo.ASCENDING)])
        await db.patients.create_index([("last_name", pymongo.ASCENDING), ("first_name", pymongo.ASCENDING)])

        # Medical records collection
        await db.medical_records.create_index([("record_id", pymongo.ASCENDING)], unique=True)
        await db.medical_records.create_index([("patient_id", pymongo.ASCENDING)])
        await db.medical_records.create_index([("record_type", pymongo.ASCENDING)])
        await db.medical_records.create_index([("date", pymongo.DESCENDING)])

        # Documents collection
        await db.documents.create_index([("document_id", pymongo.ASCENDING)], unique=True)
        await db.documents.create_index([("patient_id", pymongo.ASCENDING)])
        await db.documents.create_index([("status", pymongo.ASCENDING)])
        await db.documents.create_index([("approved_for_patient", pymongo.ASCENDING)])

        # Document chunks collection
        await db.document_chunks.create_index([("chunk_id", pymongo.ASCENDING)], unique=True)
        await db.document_chunks.create_index([("patient_id", pymongo.ASCENDING)])
        await db.document_chunks.create_index([("document_id", pymongo.ASCENDING)])
        await db.document_chunks.create_index([("patient_id", pymongo.ASCENDING), ("document_id", pymongo.ASCENDING)])

        # Appointments
        await db.appointments.create_index([("appointment_id", pymongo.ASCENDING)], unique=True)
        await db.appointments.create_index([("patient_id", pymongo.ASCENDING)])
        await db.appointments.create_index([("doctor_id", pymongo.ASCENDING)])
        await db.appointments.create_index([("start_time", pymongo.ASCENDING)])

        # Followups
        await db.followups.create_index([("followup_id", pymongo.ASCENDING)], unique=True)
        await db.followups.create_index([("patient_id", pymongo.ASCENDING)])
        await db.followups.create_index([("status", pymongo.ASCENDING)])
        await db.followups.create_index([("due_date", pymongo.ASCENDING)])

        # Notifications
        await db.notifications.create_index([("notification_id", pymongo.ASCENDING)], unique=True)
        await db.notifications.create_index([("user_id", pymongo.ASCENDING)])
        await db.notifications.create_index([("read", pymongo.ASCENDING)])
        await db.notifications.create_index([("created_at", pymongo.DESCENDING)])

        # Chat sessions & messages
        await db.chat_sessions.create_index([("session_id", pymongo.ASCENDING)], unique=True)
        await db.chat_sessions.create_index([("patient_id", pymongo.ASCENDING)])
        await db.chat_messages.create_index([("session_id", pymongo.ASCENDING)])
        await db.chat_messages.create_index([("created_at", pymongo.ASCENDING)])

        # Audit logs
        await db.audit_logs.create_index([("timestamp", pymongo.DESCENDING)])
        await db.audit_logs.create_index([("user_id", pymongo.ASCENDING)])
        await db.audit_logs.create_index([("action", pymongo.ASCENDING)])

        logger.info("Successfully created all standard MongoDB indexes.")
    except Exception as e:
        logger.warning(f"Note while creating indexes: {e}")
