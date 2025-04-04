from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID


class DocumentBase(BaseModel):
    """Base model for document metadata"""
    title: Optional[str] = None
    description: Optional[str] = None
    tags: List[str] = Field(default_factory=list)


class DocumentCreate(DocumentBase):
    """Model for document creation request"""
    pass


class DocumentMetadata(DocumentBase):
    """Model for document metadata"""
    id: UUID
    filename: str
    file_size: int
    page_count: int
    created_at: datetime
    updated_at: datetime
    status: str = "processing"  # processing, completed, failed
    error: Optional[str] = None


class ChunkMetadata(BaseModel):
    """Model for document chunk metadata"""
    document_id: UUID
    chunk_id: str
    page_number: Optional[int] = None
    chunk_index: int
    text_length: int
    metadata: Dict[str, Any] = Field(default_factory=dict)


class SearchQuery(BaseModel):
    """Model for search query"""
    query: str
    filters: Dict[str, Any] = Field(default_factory=dict)
    limit: int = 10
    offset: int = 0


class SearchResult(BaseModel):
    """Model for search result"""
    document_id: UUID
    chunk_id: str
    text: str
    score: float
    metadata: Dict[str, Any]


class SearchResponse(BaseModel):
    """Model for search response"""
    results: List[SearchResult]
    total: int


class RAGQuery(BaseModel):
    """Model for RAG query"""
    query: str
    filters: Dict[str, Any] = Field(default_factory=dict)
    max_chunks: int = 5
    temperature: float = 0.7


class RAGResponse(BaseModel):
    """Model for RAG response"""
    answer: str
    sources: List[Dict[str, Any]]
    metadata: Dict[str, Any] = Field(default_factory=dict)
