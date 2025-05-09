import pytest_asyncio
import mongomock_motor
from beanie import init_beanie
from mumundo.backend.models.user import User

@pytest_asyncio.fixture(scope="function")
async def test_db():
    client = mongomock_motor.AsyncMongoMockClient()
    db = client["test_db"]

    await init_beanie(database=db, document_models=[User])
    
    yield db
