import pytest
from httpx import AsyncClient
from mumundo.main import app

@pytest.mark.asyncio
async def test_read_root():
    from fastapi.testclient import TestClient
    
    client = TestClient(app)
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to the Mumundo API! Visit /music to see the data! Enjoy!"}
