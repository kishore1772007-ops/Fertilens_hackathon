import certifi
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional
from app.core.config import settings
from app.core.logging_config import logger

class MongoDBManager:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None

mongodb_manager = MongoDBManager()

async def connect_to_mongo():
    logger.info(f"Connecting to MongoDB at {settings.MONGODB_URI}...")
    try:
        # Use certifi for robust TLS certificate verification on Windows/Atlas
        mongodb_manager.client = AsyncIOMotorClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=5000,
            tlsCAFile=certifi.where(),
            uuidRepresentation="standard"
        )
        mongodb_manager.db = mongodb_manager.client[settings.MONGODB_DB_NAME]
        # Verify connection
        await mongodb_manager.client.admin.command('ping')
        logger.info(f"Successfully connected to MongoDB database: {settings.MONGODB_DB_NAME}")
    except Exception as e:
        logger.warning(f"Live MongoDB connection warning (attempting without tlsCAFile or using mock fallback): {e}")
        try:
            mongodb_manager.client = AsyncIOMotorClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=5000,
                uuidRepresentation="standard"
            )
            mongodb_manager.db = mongodb_manager.client[settings.MONGODB_DB_NAME]
            await mongodb_manager.client.admin.command('ping')
            logger.info("Connected to MongoDB without custom CA file.")
        except Exception as e2:
            logger.warning(f"Could not connect to live MongoDB: {e2}. Falling back to mongomock_motor for local development resilience.")
            from mongomock_motor import AsyncMongoMockClient
            mock_client = AsyncMongoMockClient()
            mongodb_manager.client = mock_client
            mongodb_manager.db = mock_client[settings.MONGODB_DB_NAME]

async def close_mongo_connection():
    if mongodb_manager.client:
        logger.info("Closing MongoDB connection...")
        try:
            mongodb_manager.client.close()
        except Exception:
            pass
        logger.info("MongoDB connection closed.")

def get_database() -> AsyncIOMotorDatabase:
    if mongodb_manager.db is None:
        try:
            client = AsyncIOMotorClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=5000,
                tlsCAFile=certifi.where(),
                uuidRepresentation="standard"
            )
            return client[settings.MONGODB_DB_NAME]
        except Exception:
            from mongomock_motor import AsyncMongoMockClient
    return mongodb_manager.db

get_db = get_database
