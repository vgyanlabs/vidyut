# System Architecture for FastAPI Document Parsing Module

## Overview

This document outlines the architecture for a FastAPI-based document parsing module with vector database integration, MongoDB, and RAG capabilities. The system is designed for Windows environments, focusing on performance, scalability for at least 100 users, and compliance with Indian legal requirements.

## System Components

### 1. FastAPI Application Layer
- **Core Web Server**: FastAPI for handling HTTP requests and responses
- **API Endpoints**: RESTful endpoints for document upload, parsing, search, and retrieval
- **Authentication & Authorization**: JWT-based authentication for secure access
- **Request Validation**: Pydantic models for request/response validation

### 2. Document Processing Layer
- **PDF Parser**: PyPDF2/PyMuPDF for extracting text from PDF documents
- **Text Preprocessing**: Cleaning, normalization, and preparation for embedding
- **Smart Chunking**: LLM-assisted chunking strategy for optimal context preservation
- **Document Metadata Extraction**: Title, author, date, and other metadata extraction

### 3. Vector Database Layer
- **ChromaDB Integration**: Local vector database for storing document embeddings
- **Embedding Generation**: Text embedding using Ollama's local LLM models
- **Vector Search**: Similarity search capabilities for semantic retrieval

### 4. Storage Layer
- **MongoDB Integration**: Document storage and metadata management
- **File System Storage**: Local storage for original PDF documents
- **Index Management**: Efficient indexing for quick retrieval

### 5. RAG Implementation Layer
- **LangChain Integration**: Framework for connecting components
- **Local LLM Integration**: Ollama with Llama 3.2 for text generation
- **Context Retrieval**: Smart context fetching based on query relevance
- **Response Generation**: LLM-powered response generation with source attribution

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      Client Applications                         │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                        FastAPI Application                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Upload API     │  │  Search API     │  │  Retrieve API   │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                     Document Processing                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  PDF Parser     │  │  Preprocessor   │  │  Smart Chunker  │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└───────────┬─────────────────────┬─────────────────────┬─────────┘
            │                     │                     │
┌───────────▼─────────┐ ┌─────────▼─────────┐ ┌─────────▼─────────┐
│  Vector Database    │ │  MongoDB Storage  │ │  RAG Engine       │
│  (ChromaDB)         │ │                   │ │  (LangChain)      │
│  ┌───────────────┐  │ │  ┌───────────────┐│ │  ┌───────────────┐│
│  │ Embeddings    │  │ │  │ Documents     ││ │  │ Ollama LLM    ││
│  └───────────────┘  │ │  └───────────────┘│ │  └───────────────┘│
└─────────────────────┘ └───────────────────┘ └───────────────────┘
```

## Data Flow

1. **Document Upload Flow**:
   - Client uploads PDF document via FastAPI endpoint
   - Document is validated and stored in file system
   - PDF text is extracted and preprocessed
   - Text is chunked using smart chunking strategy
   - Chunks are embedded using Ollama LLM
   - Embeddings are stored in ChromaDB
   - Document metadata is stored in MongoDB

2. **Search Flow**:
   - Client submits search query via FastAPI endpoint
   - Query is preprocessed and embedded
   - Vector similarity search is performed in ChromaDB
   - Relevant document chunks are retrieved
   - Results are returned to client with metadata

3. **RAG Query Flow**:
   - Client submits question via FastAPI endpoint
   - Question is preprocessed and embedded
   - Relevant context is retrieved from ChromaDB
   - Context and question are sent to Ollama LLM via LangChain
   - LLM generates response with source attribution
   - Response is returned to client

## Technical Specifications

### Windows Environment Setup
- **Python Environment**: Python 3.10+ with virtual environment
- **FastAPI Server**: Uvicorn ASGI server
- **Database**: MongoDB Community Edition for Windows
- **Vector Database**: ChromaDB local installation
- **LLM Integration**: Ollama for Windows with Llama 3.2 model

### Performance Considerations
- **Caching**: Response caching for frequent queries
- **Batch Processing**: Batch embedding for multiple documents
- **Asynchronous Operations**: Async endpoints for non-blocking operations
- **Connection Pooling**: Database connection pooling for MongoDB

### Scalability Design (100+ Users)
- **Load Distribution**: Efficient request handling
- **Resource Management**: Controlled resource allocation
- **Pagination**: Paginated results for large document sets
- **Background Tasks**: Offloading heavy processing to background tasks

### Indian Legal Compliance
- **Data Localization**: All data stored locally within Indian jurisdiction
- **Privacy Controls**: Strict access controls and data protection
- **Audit Trails**: Logging of all document access and operations
- **Retention Policies**: Configurable document retention policies

## Smart Chunking Strategy

The system will implement a hybrid chunking approach:

1. **Basic Chunking**: Initial chunking based on:
   - Natural paragraph boundaries
   - Section headers
   - Page boundaries
   - Maximum token limits

2. **LLM-Enhanced Chunking**:
   - Use Ollama's local LLM to identify semantic boundaries
   - Preserve context within chunks
   - Maintain reference relationships between chunks
   - Generate chunk summaries for improved retrieval

3. **Adaptive Chunking**:
   - Adjust chunk size based on document type and content density
   - Special handling for tables, lists, and structured content
   - Overlap strategy to prevent context loss at boundaries

## Implementation Considerations

### Low Resource Usage
- Efficient memory management for LLM operations
- Selective model loading based on operation requirements
- Configurable embedding dimensions to balance quality and performance

### Windows-Specific Optimizations
- Path handling compatible with Windows file system
- Service installation for automatic startup
- Resource monitoring and management

### Offline Capability
- Full functionality without internet connectivity
- Local model serving with Ollama
- Embedded databases for standalone operation
