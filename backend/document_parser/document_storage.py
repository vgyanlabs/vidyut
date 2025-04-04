import os
from typing import Dict, List, Optional, Any
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import PyMongoError
from bson import ObjectId
import uuid

import config
from models import DocumentMetadata, ChunkMetadata


class DocumentStorage:
    """
    Class for handling document storage in MongoDB
    """
    
    def __init__(self):
        """Initialize the document storage"""
        self.client = AsyncIOMotorClient(config.MONGODB_URL)
        self.db = self.client[config.MONGODB_DB]
        self.documents_collection = self.db[config.MONGODB_COLLECTION]
        self.chunks_collection = self.db["chunks"]
    
    async def initialize(self):
        """Initialize the database with indexes"""
        # Create indexes for documents collection
        await self.documents_collection.create_index("id", unique=True)
        await self.documents_collection.create_index("status")
        await self.documents_collection.create_index("tags")
        
        # Create indexes for chunks collection
        await self.chunks_collection.create_index("document_id")
        await self.chunks_collection.create_index("chunk_id", unique=True)
        await self.chunks_collection.create_index([("document_id", 1), ("chunk_index", 1)])
    
    async def save_document_metadata(self, metadata: DocumentMetadata) -> str:
        """
        Save document metadata to MongoDB
        
        Args:
            metadata: DocumentMetadata object
            
        Returns:
            Document ID as string
        """
        try:
            # Convert to dict and handle UUID
            metadata_dict = metadata.model_dump()
            metadata_dict["_id"] = str(metadata_dict["id"])
            
            # Insert or update document
            result = await self.documents_collection.update_one(
                {"_id": metadata_dict["_id"]},
                {"$set": metadata_dict},
                upsert=True
            )
            
            return str(metadata.id)
        
        except PyMongoError as e:
            print(f"Error saving document metadata: {str(e)}")
            raise
    
    async def save_chunk_metadata(self, chunk: ChunkMetadata) -> str:
        """
        Save chunk metadata to MongoDB
        
        Args:
            chunk: ChunkMetadata object
            
        Returns:
            Chunk ID as string
        """
        try:
            # Convert to dict and handle UUID
            chunk_dict = chunk.model_dump()
            chunk_dict["_id"] = chunk_dict["chunk_id"]
            chunk_dict["document_id"] = str(chunk_dict["document_id"])
            
            # Insert or update chunk
            result = await self.chunks_collection.update_one(
                {"_id": chunk_dict["_id"]},
                {"$set": chunk_dict},
                upsert=True
            )
            
            return chunk.chunk_id
        
        except PyMongoError as e:
            print(f"Error saving chunk metadata: {str(e)}")
            raise
    
    async def get_document_metadata(self, document_id: str) -> Optional[Dict[str, Any]]:
        """
        Get document metadata from MongoDB
        
        Args:
            document_id: Document ID
            
        Returns:
            Document metadata as dictionary or None if not found
        """
        try:
            document = await self.documents_collection.find_one({"_id": document_id})
            return document
        
        except PyMongoError as e:
            print(f"Error getting document metadata: {str(e)}")
            return None
    
    async def get_document_chunks(self, document_id: str) -> List[Dict[str, Any]]:
        """
        Get all chunks for a document from MongoDB
        
        Args:
            document_id: Document ID
            
        Returns:
            List of chunk metadata dictionaries
        """
        try:
            cursor = self.chunks_collection.find({"document_id": document_id}).sort("chunk_index", 1)
            chunks = await cursor.to_list(length=None)
            return chunks
        
        except PyMongoError as e:
            print(f"Error getting document chunks: {str(e)}")
            return []
    
    async def get_chunk(self, chunk_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific chunk from MongoDB
        
        Args:
            chunk_id: Chunk ID
            
        Returns:
            Chunk metadata as dictionary or None if not found
        """
        try:
            chunk = await self.chunks_collection.find_one({"_id": chunk_id})
            return chunk
        
        except PyMongoError as e:
            print(f"Error getting chunk: {str(e)}")
            return None
    
    async def update_document_status(self, document_id: str, status: str, error: Optional[str] = None) -> bool:
        """
        Update document status in MongoDB
        
        Args:
            document_id: Document ID
            status: New status
            error: Optional error message
            
        Returns:
            True if successful, False otherwise
        """
        try:
            update_data = {"status": status}
            if error:
                update_data["error"] = error
            
            result = await self.documents_collection.update_one(
                {"_id": document_id},
                {"$set": update_data}
            )
            
            return result.modified_count > 0
        
        except PyMongoError as e:
            print(f"Error updating document status: {str(e)}")
            return False
    
    async def delete_document(self, document_id: str) -> bool:
        """
        Delete a document and all its chunks from MongoDB
        
        Args:
            document_id: Document ID
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Delete document metadata
            doc_result = await self.documents_collection.delete_one({"_id": document_id})
            
            # Delete all chunks for this document
            chunk_result = await self.chunks_collection.delete_many({"document_id": document_id})
            
            return doc_result.deleted_count > 0
        
        except PyMongoError as e:
            print(f"Error deleting document: {str(e)}")
            return False
    
    async def search_documents(self, query: Dict[str, Any], limit: int = 10, skip: int = 0) -> List[Dict[str, Any]]:
        """
        Search for documents in MongoDB
        
        Args:
            query: MongoDB query
            limit: Maximum number of results
            skip: Number of results to skip
            
        Returns:
            List of document metadata dictionaries
        """
        try:
            cursor = self.documents_collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
            documents = await cursor.to_list(length=None)
            return documents
        
        except PyMongoError as e:
            print(f"Error searching documents: {str(e)}")
            return []
    
    async def count_documents(self, query: Dict[str, Any]) -> int:
        """
        Count documents matching a query in MongoDB
        
        Args:
            query: MongoDB query
            
        Returns:
            Number of matching documents
        """
        try:
            count = await self.documents_collection.count_documents(query)
            return count
        
        except PyMongoError as e:
            print(f"Error counting documents: {str(e)}")
            return 0
