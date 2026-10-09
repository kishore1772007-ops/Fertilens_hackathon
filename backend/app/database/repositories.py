"""
Database repositories hub providing helper utilities and common database operations
with transparent field-level encryption at rest and blind indexing.
"""
from typing import Any, Dict, List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from app.core.encryption import (
    encrypt_doc,
    decrypt_doc,
    decrypt_docs,
    compute_blind_index_token
)

class BaseRepository:
    def __init__(self, db: AsyncIOMotorDatabase, collection_name: str):
        self.db = db
        self.collection_name = collection_name
        self.collection = db[collection_name]

    @staticmethod
    def serialize_doc(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Converts ObjectId and MongoDB specific types to JSON serializable objects."""
        if not doc:
            return None
        doc = dict(doc)
        if "_id" in doc:
            doc["_id"] = str(doc["_id"])
        return doc

    @staticmethod
    def serialize_docs(docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        return [BaseRepository.serialize_doc(doc) for doc in docs if doc is not None]

    async def find_one(self, filter: Dict[str, Any], *args, **kwargs) -> Optional[Dict[str, Any]]:
        """Finds a single document, decrypts sensitive fields, and serializes ObjectId."""
        raw_doc = await self.collection.find_one(filter, *args, **kwargs)
        if not raw_doc:
            return None
        decrypted = decrypt_doc(raw_doc, self.collection_name)
        return self.serialize_doc(decrypted)

    async def find(
        self,
        filter: Optional[Dict[str, Any]] = None,
        sort: Optional[Any] = None,
        limit: Optional[int] = None,
        skip: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Finds multiple documents, decrypts sensitive fields, and serializes."""
        query_filter = filter if filter is not None else {}
        cursor = self.collection.find(query_filter)
        if sort is not None:
            cursor = cursor.sort(sort)
        if skip is not None:
            cursor = cursor.skip(skip)
        if limit is not None:
            cursor = cursor.limit(limit)
        
        raw_docs = await cursor.to_list(length=limit or 1000)
        decrypted = decrypt_docs(raw_docs, self.collection_name)
        return self.serialize_docs(decrypted)

    async def insert_one(self, doc: Dict[str, Any]) -> Any:
        """Encrypts sensitive fields and inserts into MongoDB."""
        doc_to_save = dict(doc)
        encrypted_doc = encrypt_doc(doc_to_save, self.collection_name)
        return await self.collection.insert_one(encrypted_doc)

    async def insert_many(self, docs: List[Dict[str, Any]]) -> Any:
        """Encrypts sensitive fields for a batch and inserts into MongoDB."""
        encrypted_docs = [encrypt_doc(dict(d), self.collection_name) for d in docs]
        return await self.collection.insert_many(encrypted_docs)

    async def update_one(
        self,
        filter: Dict[str, Any],
        update: Dict[str, Any],
        upsert: bool = False
    ) -> Any:
        """Encrypts sensitive fields inside $set if present, then updates document."""
        update_to_apply = dict(update)
        if "$set" in update_to_apply and isinstance(update_to_apply["$set"], dict):
            update_to_apply["$set"] = encrypt_doc(dict(update_to_apply["$set"]), self.collection_name)
        return await self.collection.update_one(filter, update_to_apply, upsert=upsert)

    async def delete_one(self, filter: Dict[str, Any]) -> Any:
        return await self.collection.delete_one(filter)

    async def delete_many(self, filter: Dict[str, Any]) -> Any:
        return await self.collection.delete_many(filter)

    async def count_documents(self, filter: Optional[Dict[str, Any]] = None) -> int:
        return await self.collection.count_documents(filter or {})


class PatientRepository(BaseRepository):
    def __init__(self, db: AsyncIOMotorDatabase):
        super().__init__(db, "patients")

    async def find_by_patient_id(self, patient_id: str) -> Optional[Dict[str, Any]]:
        return await self.find_one({"patient_id": patient_id})

    async def find_by_mrn(self, mrn: str) -> Optional[Dict[str, Any]]:
        return await self.find_one({"mrn": mrn})

    async def find_by_user_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        return await self.find_one({"user_id": user_id})

    async def search_by_name(self, query: str) -> List[Dict[str, Any]]:
        """
        Uses HMAC blind index search token to perform exact matching
        without decrypting every record or storing plaintext names in index.
        """
        token = compute_blind_index_token(query.strip().lower())
        return await self.find({"name_search_tokens": token})


class MedicalRecordRepository(BaseRepository):
    def __init__(self, db: AsyncIOMotorDatabase):
        super().__init__(db, "medical_records")

    async def find_by_patient(self, patient_id: str) -> List[Dict[str, Any]]:
        return await self.find({"patient_id": patient_id}, sort=[("date", -1)])


class DocumentRepository(BaseRepository):
    def __init__(self, db: AsyncIOMotorDatabase):
        super().__init__(db, "documents")

    async def find_by_patient(self, patient_id: str, approved_only: bool = False) -> List[Dict[str, Any]]:
        query: Dict[str, Any] = {"patient_id": patient_id}
        if approved_only:
            query["approved_for_patient"] = True
        return await self.find(query, sort=[("created_at", -1)])


class AppointmentRepository(BaseRepository):
    def __init__(self, db: AsyncIOMotorDatabase):
        super().__init__(db, "appointments")

    async def find_by_patient(self, patient_id: str) -> List[Dict[str, Any]]:
        return await self.find({"patient_id": patient_id}, sort=[("start_time", 1)])


class FollowupRepository(BaseRepository):
    def __init__(self, db: AsyncIOMotorDatabase):
        super().__init__(db, "followups")

    async def find_by_patient(self, patient_id: str) -> List[Dict[str, Any]]:
        return await self.find({"patient_id": patient_id}, sort=[("due_date", 1)])


class NotificationRepository(BaseRepository):
    def __init__(self, db: AsyncIOMotorDatabase):
        super().__init__(db, "notifications")

    async def find_by_user(self, user_id: str) -> List[Dict[str, Any]]:
        return await self.find({"user_id": user_id}, sort=[("created_at", -1)])


class ChatMessageRepository(BaseRepository):
    def __init__(self, db: AsyncIOMotorDatabase):
        super().__init__(db, "chat_messages")

    async def find_by_session(self, session_id: str) -> List[Dict[str, Any]]:
        return await self.find({"session_id": session_id}, sort=[("created_at", 1)])
