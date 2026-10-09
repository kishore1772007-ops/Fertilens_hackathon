import sys
import os
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.database import mongodb
from app.core.config import settings

@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_test_db():
    from mongomock_motor import AsyncMongoMockClient
    mock_client = AsyncMongoMockClient()
    mongodb.mongodb_manager.client = mock_client
    mongodb.mongodb_manager.db = mock_client[settings.MONGODB_DB_NAME]
    
    yield
    
    if mongodb.mongodb_manager.client:
        try:
            mongodb.mongodb_manager.client.close()
        except Exception:
            pass

@pytest_asyncio.fixture(scope="function")
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac
