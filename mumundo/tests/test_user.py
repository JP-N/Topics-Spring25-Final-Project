import pytest
from mumundo.backend.models.user import User

@pytest.mark.asyncio
async def test_create_user(test_db):
    user = User(
        email="test@example.com",
        username="testuser",
        hashed_password="test123"
    )
    await user.insert()

    found = await User.find_one(User.email == "test@example.com")
    assert found is not None
    assert found.username == "testuser"
