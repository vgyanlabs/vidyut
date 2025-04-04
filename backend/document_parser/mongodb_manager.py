import os
import asyncio
from typing import Dict, Any, Optional, List
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
from pymongo.errors import PyMongoError
import uuid

import config


class MongoDBManager:
    """
    Class for managing MongoDB connections and operations
    """
    
    def __init__(self):
        """Initialize the MongoDB manager"""
        self.async_client = AsyncIOMotorClient(config.MONGODB_URL)
        self.sync_client = MongoClient(config.MONGODB_URL)
        self.db_name = config.MONGODB_DB
        self.async_db = self.async_client[self.db_name]
        self.sync_db = self.sync_client[self.db_name]
        
        # Collections
        self.documents_collection = self.async_db["documents"]
        self.chunks_collection = self.async_db["chunks"]
        self.users_collection = self.async_db["users"]
        self.audit_logs_collection = self.async_db["audit_logs"]
    
    async def initialize_db(self):
        """
        Initialize the database with required collections and indexes
        """
        try:
            # Create indexes for documents collection
            await self.documents_collection.create_index("id", unique=True)
            await self.documents_collection.create_index("status")
            await self.documents_collection.create_index("tags")
            await self.documents_collection.create_index("created_at")
            
            # Create indexes for chunks collection
            await self.chunks_collection.create_index("document_id")
            await self.chunks_collection.create_index("chunk_id", unique=True)
            await self.chunks_collection.create_index([("document_id", 1), ("chunk_index", 1)])
            
            # Create indexes for users collection
            await self.users_collection.create_index("username", unique=True)
            await self.users_collection.create_index("email", unique=True)
            
            # Create indexes for audit logs collection
            await self.audit_logs_collection.create_index("timestamp")
            await self.audit_logs_collection.create_index("user_id")
            await self.audit_logs_collection.create_index("document_id")
            await self.audit_logs_collection.create_index("action")
            
            return True
        
        except PyMongoError as e:
            print(f"Error initializing MongoDB: {str(e)}")
            return False
    
    async def create_user(self, username: str, email: str, hashed_password: str, role: str = "user") -> Optional[str]:
        """
        Create a new user
        
        Args:
            username: Username
            email: Email address
            hashed_password: Hashed password
            role: User role (default: "user")
            
        Returns:
            User ID if successful, None otherwise
        """
        try:
            user_id = str(uuid.uuid4())
            user_data = {
                "_id": user_id,
                "username": username,
                "email": email,
                "password": hashed_password,
                "role": role,
                "created_at": asyncio.get_event_loop().time()
            }
            
            result = await self.users_collection.insert_one(user_data)
            return user_id if result.acknowledged else None
        
        except PyMongoError as e:
            print(f"Error creating user: {str(e)}")
            return None
    
    async def get_user(self, username: str) -> Optional[Dict[str, Any]]:
        """
        Get user by username
        
        Args:
            username: Username
            
        Returns:
            User data if found, None otherwise
        """
        try:
            user = await self.users_collection.find_one({"username": username})
            return user
        
        except PyMongoError as e:
            print(f"Error getting user: {str(e)}")
            return None
    
    async def log_audit_event(self, user_id: str, action: str, document_id: Optional[str] = None, details: Optional[Dict[str, Any]] = None) -> bool:
        """
        Log an audit event
        
        Args:
            user_id: User ID
            action: Action performed
            document_id: Optional document ID
            details: Optional additional details
            
        Returns:
            True if successful, False otherwise
        """
        try:
            log_data = {
                "_id": str(uuid.uuid4()),
                "user_id": user_id,
                "action": action,
                "timestamp": asyncio.get_event_loop().time()
            }
            
            if document_id:
                log_data["document_id"] = document_id
            
            if details:
                log_data["details"] = details
            
            result = await self.audit_logs_collection.insert_one(log_data)
            return result.acknowledged
        
        except PyMongoError as e:
            print(f"Error logging audit event: {str(e)}")
            return False
    
    async def get_audit_logs(self, filters: Dict[str, Any], limit: int = 100, skip: int = 0) -> List[Dict[str, Any]]:
        """
        Get audit logs with filtering
        
        Args:
            filters: Query filters
            limit: Maximum number of logs to return
            skip: Number of logs to skip
            
        Returns:
            List of audit logs
        """
        try:
            cursor = self.audit_logs_collection.find(filters).sort("timestamp", -1).skip(skip).limit(limit)
            logs = await cursor.to_list(length=None)
            return logs
        
        except PyMongoError as e:
            print(f"Error getting audit logs: {str(e)}")
            return []
    
    def get_sync_collection(self, collection_name: str):
        """
        Get a synchronous collection for bulk operations
        
        Args:
            collection_name: Name of the collection
            
        Returns:
            Synchronous collection
        """
        return self.sync_db[collection_name]
    
    def close_connections(self):
        """Close all MongoDB connections"""
        self.async_client.close()
        self.sync_client.close()
