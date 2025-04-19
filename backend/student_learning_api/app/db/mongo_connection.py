# app/db/mongo_connection.py
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
import logging
from pymongo import IndexModel, ASCENDING, DESCENDING, TEXT

class MongoDB:
    """Enhanced MongoDB connection with advanced indexing and monitoring"""
    def __init__(self):
        self.client = None
        self.db = None
        self.logger = logging.getLogger("mongodb")

    async def connect(self):
        """Connect with optimized connection pooling"""
        # REMEMBER: Connection pooling is crucial for performance
        self.client = AsyncIOMotorClient(
            settings.MONGO_URI,
            maxPoolSize=settings.MONGO_MAX_POOL_SIZE,
            minPoolSize=settings.MONGO_MIN_POOL_SIZE,
            maxIdleTimeMS=settings.MONGO_MAX_IDLE_TIME_MS,
            waitQueueTimeoutMS=settings.MONGO_WAIT_QUEUE_TIMEOUT_MS
        )
        self.db = self.client[settings.DATABASE_NAME]
        await self._create_indexes()
        self.logger.info("MongoDB connection established")

    async def _create_indexes(self):
        """Create optimized indexes for common query patterns"""
        # REMEMBER: Proper indexing is key to MongoDB performance
        
        # Student collection indexes
        await self.db.students.create_index([("email", ASCENDING)], unique=True)
        await self.db.students.create_index([("enrolled_courses", ASCENDING)])
        await self.db.students.create_index([("progress.topic_id", ASCENDING)])
        await self.db.students.create_index([("learning_path_id", ASCENDING)])
        await self.db.students.create_index([("last_login", DESCENDING)])  # For activity reports
        
        # Topic collection indexes
        await self.db.topics.create_index([("name", TEXT), ("description", TEXT)])  # Full text search
        await self.db.topics.create_index([("tags", ASCENDING)])  # For tag-based queries
        await self.db.topics.create_index([("difficulty_level", ASCENDING)])  # For difficulty filtering
        
        # Learning path indexes
        await self.db.learning_paths.create_index([("name", TEXT)])
        
        # Compound indexes for common query patterns
        await self.db.students.create_index([
            ("enrolled_courses", ASCENDING), 
            ("progress.completion_status", DESCENDING)
        ])  # For finding progress in specific courses
        
        self.logger.info("MongoDB indexes created successfully")
        
    async def close(self):
        """Properly close the MongoDB connection"""
        self.client.close()
        self.logger.info("MongoDB connection closed")

    async def get_db_stats(self):
        """Get database statistics for monitoring"""
        return await self.db.command("dbStats")

mongodb = MongoDB()