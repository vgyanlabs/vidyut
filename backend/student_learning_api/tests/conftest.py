# tests/conftest.py
import pytest
from app.db.mongo_connection import mongodb

@pytest.fixture(scope="function")
async def test_db():
    await mongodb.connect()
    db = mongodb.db

    # Clean up before test
    await db["students"].delete_many({})

    yield db  # Yield the actual database object

    # Clean up after test
    await db["students"].delete_many({})
    await mongodb.close()
