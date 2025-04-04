import asyncio
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from uuid import UUID

from document_storage import DocumentStorage
from document_parser import DocumentParser
from vector_database import VectorDatabase
from models import SearchQuery, SearchResponse, SearchResult

router = APIRouter()
vector_db = VectorDatabase()
document_parser = DocumentParser()


async def get_storage():
    """Dependency to get initialized document storage"""
    await document_storage.initialize()
    return document_storage


@router.post("/search/", response_model=SearchResponse)
async def search_documents(
    query: SearchQuery,
    storage: DocumentStorage = Depends(get_storage)
):
    """
    Search for documents using vector similarity
    
    Args:
        query: Search query parameters
        
    Returns:
        Search results
    """
    # Perform vector search
    search_results = vector_db.search(
        query=query.query,
        filters=query.filters,
        limit=query.limit
    )
    
    # Format results
    results = []
    for result in search_results:
        chunk_id = result["id"]
        
        # Get chunk metadata from MongoDB for additional information
        chunk_data = await storage.get_chunk(chunk_id)
        
        if chunk_data:
            # Create search result
            search_result = SearchResult(
                document_id=UUID(chunk_data["document_id"]),
                chunk_id=chunk_id,
                text=result["text"],
                score=result["score"],
                metadata={
                    **chunk_data.get("metadata", {}),
                    "page_number": chunk_data.get("page_number"),
                    "chunk_index": chunk_data.get("chunk_index")
                }
            )
            results.append(search_result)
    
    # Return search response
    return SearchResponse(
        results=results,
        total=len(results)
    )


@router.post("/documents/{document_id}/index")
async def index_document(
    document_id: UUID,
    storage: DocumentStorage = Depends(get_storage)
):
    """
    Index a document in the vector database
    
    Args:
        document_id: Document ID
        
    Returns:
        Success message
    """
    # Get document metadata
    document = await storage.get_document_metadata(str(document_id))
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Get document chunks
    chunks = await storage.get_document_chunks(str(document_id))
    
    if not chunks:
        raise HTTPException(status_code=404, detail="No chunks found for document")
    
    # Get file path from document metadata
    filename = document.get("filename", "")
    file_path = f"{document_parser.upload_dir}/{document_id}_{filename}"
    
    # Prepare chunks for vector database
    vector_chunks = []
    for chunk in chunks:
        # Get chunk text
        chunk_text = document_parser.get_chunk_text(
            document_id=str(document_id),
            file_path=file_path,
            chunk_metadata=chunk
        )
        
        if chunk_text:
            # Prepare metadata
            metadata = {
                "document_id": str(document_id),
                "page_number": chunk.get("page_number", 0),
                "chunk_index": chunk.get("chunk_index", 0),
                "title": document.get("title", ""),
                "tags": ",".join(document.get("tags", []))
            }
            
            # Add to vector chunks
            vector_chunks.append((chunk["_id"], chunk_text, metadata))
    
    # Add chunks to vector database
    success = vector_db.add_chunks(vector_chunks)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to index document")
    
    # Update document status
    await storage.update_document_status(str(document_id), "indexed")
    
    return {"message": f"Document indexed successfully with {len(vector_chunks)} chunks"}


@router.delete("/documents/{document_id}/index")
async def delete_document_index(
    document_id: UUID,
    storage: DocumentStorage = Depends(get_storage)
):
    """
    Delete a document from the vector database
    
    Args:
        document_id: Document ID
        
    Returns:
        Success message
    """
    # Delete document chunks from vector database
    success = vector_db.delete_document_chunks(str(document_id))
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete document index")
    
    # Update document status
    await storage.update_document_status(str(document_id), "unindexed")
    
    return {"message": "Document index deleted successfully"}
