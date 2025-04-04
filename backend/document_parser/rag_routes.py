import asyncio
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from uuid import UUID

from document_storage import DocumentStorage
from document_parser import DocumentParser
from vector_database import VectorDatabase
from rag_engine import RAGEngine
from models import RAGQuery, RAGResponse
from auth_routes import get_current_active_user, UserInDB

router = APIRouter()
rag_engine = RAGEngine()
vector_db = VectorDatabase()
document_parser = DocumentParser()


async def get_storage():
    """Dependency to get initialized document storage"""
    await document_storage.initialize()
    return document_storage


@router.post("/rag/query", response_model=RAGResponse)
async def rag_query(
    query: RAGQuery,
    current_user: UserInDB = Depends(get_current_active_user),
    storage: DocumentStorage = Depends(get_storage)
):
    """
    Process a RAG query
    
    Args:
        query: RAG query parameters
        
    Returns:
        RAG response with answer and sources
    """
    # Process the query
    response = rag_engine.process_query(query)
    
    # Log the query
    await storage.log_audit_event(
        user_id=current_user.username,
        action="rag_query",
        details={
            "query": query.query,
            "filters": query.filters,
            "max_chunks": query.max_chunks
        }
    )
    
    return response


@router.post("/documents/{document_id}/summarize")
async def summarize_document(
    document_id: UUID,
    max_length: int = Body(500),
    current_user: UserInDB = Depends(get_current_active_user),
    storage: DocumentStorage = Depends(get_storage)
):
    """
    Generate a summary of a document
    
    Args:
        document_id: Document ID
        max_length: Maximum length of summary
        
    Returns:
        Document summary
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
    
    # Combine chunks into full text
    full_text = ""
    for chunk in sorted(chunks, key=lambda x: x.get("chunk_index", 0)):
        chunk_text = document_parser.get_chunk_text(
            document_id=str(document_id),
            file_path=file_path,
            chunk_metadata=chunk
        )
        if chunk_text:
            full_text += chunk_text + "\n\n"
    
    # Generate summary
    summary = rag_engine.summarize_document(full_text, max_length)
    
    # Log the action
    await storage.log_audit_event(
        user_id=current_user.username,
        action="summarize_document",
        document_id=str(document_id),
        details={"max_length": max_length}
    )
    
    return {"summary": summary}


@router.post("/documents/{document_id}/key_points")
async def extract_key_points(
    document_id: UUID,
    max_points: int = Body(10),
    current_user: UserInDB = Depends(get_current_active_user),
    storage: DocumentStorage = Depends(get_storage)
):
    """
    Extract key points from a document
    
    Args:
        document_id: Document ID
        max_points: Maximum number of key points to extract
        
    Returns:
        List of key points
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
    
    # Combine chunks into full text
    full_text = ""
    for chunk in sorted(chunks, key=lambda x: x.get("chunk_index", 0)):
        chunk_text = document_parser.get_chunk_text(
            document_id=str(document_id),
            file_path=file_path,
            chunk_metadata=chunk
        )
        if chunk_text:
            full_text += chunk_text + "\n\n"
    
    # Extract key points
    key_points = rag_engine.extract_key_points(full_text, max_points)
    
    # Log the action
    await storage.log_audit_event(
        user_id=current_user.username,
        action="extract_key_points",
        document_id=str(document_id),
        details={"max_points": max_points}
    )
    
    return {"key_points": key_points}


@router.post("/documents/{document_id}/smart_reindex")
async def smart_reindex_document(
    document_id: UUID,
    current_user: UserInDB = Depends(get_current_active_user),
    storage: DocumentStorage = Depends(get_storage)
):
    """
    Reindex a document using LLM-assisted smart chunking
    
    Args:
        document_id: Document ID
        
    Returns:
        Success message
    """
    # Get document metadata
    document = await storage.get_document_metadata(str(document_id))
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Get file path from document metadata
    filename = document.get("filename", "")
    file_path = f"{document_parser.upload_dir}/{document_id}_{filename}"
    
    # Extract text from document
    pages = document_parser.extract_text(file_path)
    
    if not pages:
        raise HTTPException(status_code=500, detail="Failed to extract text from document")
    
    # Combine pages into full text
    full_text = "\n\n".join(page["text"] for page in pages)
    
    # Perform smart chunking
    smart_chunks = rag_engine.smart_chunk_text(full_text)
    
    # Delete existing chunks from vector database
    vector_db.delete_document_chunks(str(document_id))
    
    # Prepare chunks for vector database
    vector_chunks = []
    for i, chunk in enumerate(smart_chunks):
        chunk_id = f"{document_id}_smart_{i}"
        
        # Prepare metadata
        metadata = {
            "document_id": str(document_id),
            "chunk_index": i,
            "title": document.get("title", ""),
            "tags": ",".join(document.get("tags", [])),
            "is_enhanced": chunk.metadata.get("is_enhanced", False)
        }
        
        # Add to vector chunks
        vector_chunks.append((chunk_id, chunk.page_content, metadata))
    
    # Add chunks to vector database
    success = vector_db.add_chunks(vector_chunks)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to index document")
    
    # Update document status
    await storage.update_document_status(str(document_id), "smart_indexed")
    
    # Log the action
    await storage.log_audit_event(
        user_id=current_user.username,
        action="smart_reindex",
        document_id=str(document_id),
        details={"chunk_count": len(smart_chunks)}
    )
    
    return {
        "message": f"Document smart reindexed successfully with {len(smart_chunks)} chunks",
        "chunk_count": len(smart_chunks)
    }
