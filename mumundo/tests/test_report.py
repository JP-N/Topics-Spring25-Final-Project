from beanie import Document, init_beanie
import mongomock_motor
import pytest
from datetime import datetime

import pytest_asyncio
from mumundo.backend.models.user import User
from bson import ObjectId

class Playlist(Document):
    Title: str
    User: str

class PlaylistReport(Document):
    playlist_id:str
    user_id:str
    reason:str
    created_at:datetime
    status:str

@pytest.mark.asyncio
async def test_submit_playlist_report(test_db):
    user = User(email="test@example.com", username="reporttest", hashed_password="test")
    await user.insert()

    playlist = Playlist(Title="Reporting", User=str(user.id))
    await playlist.insert()

    report = PlaylistReport(
        playlist_id=str(playlist.id),
        user_id=str(user.id),
        reason="Spam",
        created_at=datetime.utcnow(),
        status="pending"
    )
    await report.insert()

    found = await PlaylistReport.find_one(PlaylistReport.user_id == str(user.id))
    assert found is not None
    assert found.reason == "Spam"
    assert found.status == "pending"

    
@pytest_asyncio.fixture(scope="function")
async def test_db():
    client = mongomock_motor.AsyncMongoMockClient()
    db = client["test_db"]

    # Initialize all models in the init_beanie call
    await init_beanie(database=db, document_models=[User, Playlist, PlaylistReport])
    
    yield db
