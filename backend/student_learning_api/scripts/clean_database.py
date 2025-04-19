# scripts/clean_database.py
import asyncio
from app.db.mongo_connection import mongodb

async def clean_database():
    await mongodb.connect()
    db = mongodb.db

    # Specify the collections you want to clean
    collections_to_clean = ["students", "topics", "learning_paths"]

    for collection_name in collections_to_clean:
        result = await db[collection_name].delete_many({})
        print(f"Deleted {result.deleted_count} documents from '{collection_name}'")

    await mongodb.close()

if __name__ == "__main__":
    asyncio.run(clean_database())
