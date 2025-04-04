import os
import asyncio
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks, Depends
from fastapi.responses import JSONResponse
from uuid import UUID

from document_parser import DocumentParser
from document_storage import DocumentStorage
from models import DocumentCreate, DocumentMetadata, ChunkMetadata

router = APIRouter()
document_parser = DocumentParser()
document_storage = DocumentStorage()


async def get_storage():
    """Dependency to get initialized document storage"""
    await document_storage.initialize()
    return document_storage


@router.post("/documents/", response_model=DocumentMetadata)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    storage: DocumentStorage = Depends(get_storage)
):
    """
    Upload a PDF document for parsing and storage
    
    Args:
        file: The PDF file to upload
        title: Optional document title
        description: Optional document description
        tags: Optional comma-separated tags
        
    Returns:
        Document metadata
    """
    # Validate file extension
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    # Read file content
    file_content = await file.read()
    
    # Process document in the background
    background_tasks.add_task(
        process_document_task,
        file_content,
        file.filename,
        title,
        description,
        tags.split(',') if tags else []
    )
    
    # Create initial metadata
    document_id = str(UUID(bytes=os.urandom(16)))
    metadata = DocumentMetadata(
        id=UUID(document_id),
        filename=file.filename,
        title=title or file.filename,
        description=description,
        tags=tags.split(',') if tags else [],
        file_size=len(file_content),
        page_count=0,
        created_at=None,  # Will be set during processing
        updated_at=None,  # Will be set during processing
        status="processing"
    )
    
    # Save initial metadata
    await storage.save_document_metadata(metadata)
    
    return metadata


async def process_document_task(
    file_content: bytes,
    filename: str,
    title: Optional[str],
    description: Optional[str],
    tags: List[str]
):
    """
    Background task to process a document
    
    Args:
        file_content: The binary content of the file
        filename: Original filename
        title: Optional document title
        description: Optional document description
        tags: Optional list of tags
    """
    try:
        # Process the document
        metadata, chunks = document_parser.process_document(file_content, filename)
        
        # Update metadata with user-provided values
        if title:
            metadata.title = title
        if description:
            metadata.description = description
        if tags:
            metadata.tags = tags
        
        # Save metadata to MongoDB
        await document_storage.save_document_metadata(metadata)
        
        # Save chunks to MongoDB
        for chunk in chunks:
            await document_storage.save_chunk_metadata(chunk)
        
    except Exception as e:
        # Update document status to failed
        document_id = str(UUID(bytes=os.urandom(16)))
        await document_storage.update_document_status(document_id, "failed", str(e))


@router.get("/documents/", response_model=List[DocumentMetadata])
async def list_documents(
    skip: int = 0,
    limit: int = 10,
    status: Optional[str] = None,
    tag: Optional[str] = None,
    storage: DocumentStorage = Depends(get_storage)
):
    """
    List documents with optional filtering
    
    Args:
        skip: Number of documents to skip
        limit: Maximum number of documents to return
        status: Filter by status
        tag: Filter by tag
        
    Returns:
        List of document metadata
    """
    # Build query
    query = {}
    if status:
        query["status"] = status
    if tag:
        query["tags"] = tag
    
    # Get documents
    documents = await storage.search_documents(query, limit, skip)
    
    # Convert to DocumentMetadata objects
    result = []
    for doc in documents:
        # Convert MongoDB _id to id
        doc["id"] = doc.pop("_id")
        result.append(DocumentMetadata(**doc))
    
    return result


@router.get("/documents/{document_id}", response_model=DocumentMetadata)
async def get_document(
    document_id: UUID,
    storage: DocumentStorage = Depends(get_storage)
):
    """
    Get document metadata by ID
    
    Args:
        document_id: Document ID
        
    Returns:
        Document metadata
    """
    # Get document
    document = await storage.get_document_metadata(str(document_id))
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Convert MongoDB _id to id
    document["id"] = document.pop("_id")
    
    return DocumentMetadata(**document)


@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: UUID,
    storage: DocumentStorage = Depends(get_storage)
):
    """
    Delete a document and all its chunks
    
    Args:
        document_id: Document ID
        
    Returns:
        Success message
    """
    # Delete document
    success = await storage.delete_document(str(document_id))
    
    if not success:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {"message": "Document deleted successfully"}


@router.get("/documents/{document_id}/chunks", response_model=List[ChunkMetadata])
async def get_document_chunks(
    document_id: UUID,
    storage: DocumentStorage = Depends(get_storage)
):
    """
    Get all chunks for a document
    
    Args:
        document_id: Document ID
        
    Returns:
        List of chunk metadata
    """
    # Get chunks
    chunks = await storage.get_document_chunks(str(document_id))
    
    # Convert to ChunkMetadata objects
    result = []
    for chunk in chunks:
        # Convert MongoDB _id to chunk_id if needed
        if "_id" in chunk:
            chunk["chunk_id"] = chunk.pop("_id")
        # Convert document_id string to UUID
        chunk["document_id"] = UUID(chunk["document_id"])
        result.append(ChunkMetadata(**chunk))
    
    return result
