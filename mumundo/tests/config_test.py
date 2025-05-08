from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from backend.models.user import User

TEST_DB_URL = "mongodb://localhost:27018/test_db"

@pytest.fixture(scope="function", autouse=True)
async def test_db():
    client = AsyncIOMotorClient(TEST_DB_URL)
    db = client.get_default_database()
    await init_beanie(database=db, document_models=[User])
    yield
    await db.client.drop_database("test_db")
