import os
from typing import List, Dict, Any, Optional, Tuple
from uuid import UUID
import chromadb
from chromadb.config import Settings
from chromadb.utils import embedding_functions

import config
from models import ChunkMetadata


class VectorDatabase:
    """
    Class for handling vector database operations with ChromaDB
    """
    
    def __init__(self):
        """Initialize the vector database"""
        # Create ChromaDB client with persistence
        self.client = chromadb.PersistentClient(
            path=config.CHROMA_PERSIST_DIRECTORY,
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )
        
        # Set up embedding function using Ollama
        self.embedding_function = embedding_functions.OllamaEmbeddingFunction(
            model_name=config.EMBEDDING_MODEL_NAME,
            url=config.OLLAMA_BASE_URL
        )
        
        # Create or get the collection
        self.collection = self.client.get_or_create_collection(
            name="document_chunks",
            embedding_function=self.embedding_function,
            metadata={"hnsw:space": "cosine"}
        )
    
    def add_chunk(self, chunk_id: str, text: str, metadata: Dict[str, Any]) -> bool:
        """
        Add a document chunk to the vector database
        
        Args:
            chunk_id: Unique ID for the chunk
            text: Text content of the chunk
            metadata: Metadata for the chunk
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Prepare metadata (ensure all values are strings for ChromaDB compatibility)
            chroma_metadata = {}
            for key, value in metadata.items():
                if isinstance(value, dict):
                    # Skip nested dictionaries
                    continue
                elif isinstance(value, list):
                    # Convert lists to comma-separated strings
                    chroma_metadata[key] = ",".join(str(item) for item in value)
                else:
                    # Convert other values to strings
                    chroma_metadata[key] = str(value)
            
            # Add document to collection
            self.collection.add(
                ids=[chunk_id],
                documents=[text],
                metadatas=[chroma_metadata]
            )
            
            return True
        
        except Exception as e:
            print(f"Error adding chunk to vector database: {str(e)}")
            return False
    
    def add_chunks(self, chunks: List[Tuple[str, str, Dict[str, Any]]]) -> bool:
        """
        Add multiple document chunks to the vector database
        
        Args:
            chunks: List of tuples containing (chunk_id, text, metadata)
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Prepare data for batch insertion
            ids = []
            documents = []
            metadatas = []
            
            for chunk_id, text, metadata in chunks:
                ids.append(chunk_id)
                documents.append(text)
                
                # Prepare metadata (ensure all values are strings for ChromaDB compatibility)
                chroma_metadata = {}
                for key, value in metadata.items():
                    if isinstance(value, dict):
                        # Skip nested dictionaries
                        continue
                    elif isinstance(value, list):
                        # Convert lists to comma-separated strings
                        chroma_metadata[key] = ",".join(str(item) for item in value)
                    else:
                        # Convert other values to strings
                        chroma_metadata[key] = str(value)
                
                metadatas.append(chroma_metadata)
            
            # Add documents to collection in batch
            self.collection.add(
                ids=ids,
                documents=documents,
                metadatas=metadatas
            )
            
            return True
        
        except Exception as e:
            print(f"Error adding chunks to vector database: {str(e)}")
            return False
    
    def search(self, query: str, filters: Optional[Dict[str, Any]] = None, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Search for similar document chunks
        
        Args:
            query: Search query
            filters: Optional metadata filters
            limit: Maximum number of results
            
        Returns:
            List of search results with document chunks and metadata
        """
        try:
            # Prepare filter if provided
            where_clause = {}
            if filters:
                for key, value in filters.items():
                    if isinstance(value, list):
                        # Handle list values (OR condition)
                        where_clause[key] = {"$in": [str(item) for item in value]}
                    else:
                        # Handle scalar values
                        where_clause[key] = str(value)
            
            # Perform search
            results = self.collection.query(
                query_texts=[query],
                where=where_clause if where_clause else None,
                n_results=limit,
                include=["documents", "metadatas", "distances"]
            )
            
            # Format results
            formatted_results = []
            
            if results["ids"] and results["ids"][0]:
                for i, doc_id in enumerate(results["ids"][0]):
                    formatted_results.append({
                        "id": doc_id,
                        "text": results["documents"][0][i],
                        "metadata": results["metadatas"][0][i],
                        "score": 1.0 - float(results["distances"][0][i])  # Convert distance to similarity score
                    })
            
            return formatted_results
        
        except Exception as e:
            print(f"Error searching vector database: {str(e)}")
            return []
    
    def delete_chunk(self, chunk_id: str) -> bool:
        """
        Delete a document chunk from the vector database
        
        Args:
            chunk_id: ID of the chunk to delete
            
        Returns:
            True if successful, False otherwise
        """
        try:
            self.collection.delete(ids=[chunk_id])
            return True
        
        except Exception as e:
            print(f"Error deleting chunk from vector database: {str(e)}")
            return False
    
    def delete_document_chunks(self, document_id: str) -> bool:
        """
        Delete all chunks for a document from the vector database
        
        Args:
            document_id: Document ID
            
        Returns:
            True if successful, False otherwise
        """
        try:
            self.collection.delete(where={"document_id": str(document_id)})
            return True
        
        except Exception as e:
            print(f"Error deleting document chunks from vector database: {str(e)}")
            return False
    
    def get_chunk(self, chunk_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific chunk from the vector database
        
        Args:
            chunk_id: Chunk ID
            
        Returns:
            Chunk data or None if not found
        """
        try:
            result = self.collection.get(ids=[chunk_id], include=["documents", "metadatas", "embeddings"])
            
            if result["ids"]:
                return {
                    "id": result["ids"][0],
                    "text": result["documents"][0],
                    "metadata": result["metadatas"][0],
                    "embedding": result["embeddings"][0]
                }
            
            return None
        
        except Exception as e:
            print(f"Error getting chunk from vector database: {str(e)}")
            return None
