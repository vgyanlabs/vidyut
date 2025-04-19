import pytest
import httpx
from httpx import AsyncClient,ASGITransport
from app.main import app
from tests.conftest import test_db  # Corrected import path

@pytest.mark.asyncio
async def test_create_student(test_db):
    async with AsyncClient(
        base_url="http://test",
        transport=httpx.ASGITransport(app=app)  # key fix here
    ) as client:
        response = await client.post(
            "/api/v1/students/",
            json={
                "name": "Test Student",
                "email": "test@example.com"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Test Student"
        assert data["email"] == "test@example.com"
        assert "id" in data
