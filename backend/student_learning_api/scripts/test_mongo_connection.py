# scripts/test_mongo_connection.py

import asyncio
from app.db.mongo_connection import mongodb

async def main():
    try:
        await mongodb.connect()
        stats = await mongodb.get_db_stats()
        print("✅ MongoDB connected successfully.")
        print("📊 DB Stats (collection count):", stats.get("collections"))
    except Exception as e:
        print("❌ Failed to connect to MongoDB:", str(e))
    finally:
        await mongodb.close()

if __name__ == "__main__":
    asyncio.run(main())
