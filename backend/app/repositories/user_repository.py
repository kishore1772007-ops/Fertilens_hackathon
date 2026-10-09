from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from app.database.repositories import BaseRepository

class UserRepository(BaseRepository):
    def __init__(self, db: AsyncIOMotorDatabase):
        super().__init__(db, "users")
        self.refresh_tokens = db["refresh_tokens"]

    async def get_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        query = {"_id": ObjectId(user_id)} if ObjectId.is_valid(user_id) else {"_id": user_id}
        doc = await self.collection.find_one(query)
        return self.serialize_doc(doc)

    async def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        doc = await self.collection.find_one({"email": email.lower().strip()})
        return self.serialize_doc(doc)

    async def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        data = dict(user_data)
        data["email"] = data["email"].lower().strip()
        data["created_at"] = datetime.now(timezone.utc)
        data["updated_at"] = datetime.now(timezone.utc)
        data["failed_login_attempts"] = 0
        data["locked_until"] = None
        data["is_active"] = data.get("is_active", True)
        result = await self.collection.insert_one(data)
        data["_id"] = str(result.inserted_id)
        return data

    async def update_failed_attempts(self, email: str, attempts: int, locked_until: Optional[datetime] = None):
        update_data: Dict[str, Any] = {
            "failed_login_attempts": attempts,
            "updated_at": datetime.now(timezone.utc)
        }
        if locked_until is not None:
            update_data["locked_until"] = locked_until
        elif attempts == 0:
            update_data["locked_until"] = None

        await self.collection.update_one(
            {"email": email.lower().strip()},
            {"$set": update_data}
        )

    async def reset_failed_attempts(self, email: str):
        await self.collection.update_one(
            {"email": email.lower().strip()},
            {
                "$set": {
                    "failed_login_attempts": 0,
                    "locked_until": None,
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )

    # ---------------- Refresh Token Operations ---------------- #

    async def store_refresh_token(self, user_id: str, jti_hash: str, expires_at: datetime) -> Dict[str, Any]:
        record = {
            "user_id": str(user_id),
            "jti_hash": jti_hash,
            "expires_at": expires_at,
            "revoked": False,
            "created_at": datetime.now(timezone.utc)
        }
        await self.refresh_tokens.insert_one(record)
        return record

    async def get_refresh_token_by_hash(self, jti_hash: str) -> Optional[Dict[str, Any]]:
        doc = await self.refresh_tokens.find_one({"jti_hash": jti_hash})
        return self.serialize_doc(doc)

    async def revoke_refresh_token(self, jti_hash: str):
        await self.refresh_tokens.update_one(
            {"jti_hash": jti_hash},
            {"$set": {"revoked": True, "revoked_at": datetime.now(timezone.utc)}}
        )

    async def revoke_all_user_tokens(self, user_id: str):
        """Used when refresh token reuse is detected to invalidate entire chain."""
        await self.refresh_tokens.update_many(
            {"user_id": str(user_id)},
            {"$set": {"revoked": True, "revoked_at": datetime.now(timezone.utc)}}
        )
