import os
import uuid
import fitz  # PyMuPDF
import tempfile
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path

import config
from models import DocumentMetadata, ChunkMetadata


class DocumentParser:
    """
    Class for parsing PDF documents and extracting text with smart chunking
    """
    
    def __init__(self):
        """Initialize the document parser"""
        self.upload_dir = config.UPLOAD_DIR
        self.temp_dir = config.TEMP_DIR
        self.chunk_size = config.CHUNK_SIZE
        self.chunk_overlap = config.CHUNK_OVERLAP
        self.min_chunk_size = config.MIN_CHUNK_SIZE
        self.max_chunk_size = config.MAX_CHUNK_SIZE
    
    def save_document(self, file_content: bytes, filename: str) -> Tuple[str, str]:
        """
        Save the uploaded document to the file system
        
        Args:
            file_content: The binary content of the file
            filename: Original filename
            
        Returns:
            Tuple containing document_id and file path
        """
        # Generate a unique ID for the document
        document_id = str(uuid.uuid4())
        
        # Create a safe filename
        safe_filename = f"{document_id}_{Path(filename).name}"
        file_path = os.path.join(self.upload_dir, safe_filename)
        
        # Save the file
        with open(file_path, "wb") as f:
            f.write(file_content)
            
        return document_id, file_path
    
    def extract_metadata(self, file_path: str, original_filename: str) -> DocumentMetadata:
        """
        Extract metadata from the PDF document
        
        Args:
            file_path: Path to the saved document
            original_filename: Original filename
            
        Returns:
            DocumentMetadata object
        """
        try:
            # Open the PDF
            pdf_document = fitz.open(file_path)
            
            # Extract basic metadata
            file_size = os.path.getsize(file_path)
            page_count = len(pdf_document)
            
            # Try to extract title from PDF metadata
            title = pdf_document.metadata.get("title", original_filename)
            
            # Create document metadata
            metadata = DocumentMetadata(
                id=uuid.UUID(file_path.split('/')[-1].split('_')[0]),
                filename=original_filename,
                title=title,
                file_size=file_size,
                page_count=page_count,
                created_at=datetime.now(),
                updated_at=datetime.now(),
                status="processing"
            )
            
            pdf_document.close()
            return metadata
            
        except Exception as e:
            # If metadata extraction fails, create minimal metadata
            metadata = DocumentMetadata(
                id=uuid.UUID(file_path.split('/')[-1].split('_')[0]),
                filename=original_filename,
                title=original_filename,
                file_size=os.path.getsize(file_path),
                page_count=0,
                created_at=datetime.now(),
                updated_at=datetime.now(),
                status="failed",
                error=str(e)
            )
            return metadata
    
    def extract_text(self, file_path: str) -> List[Dict[str, Any]]:
        """
        Extract text from PDF document with page information
        
        Args:
            file_path: Path to the PDF file
            
        Returns:
            List of dictionaries containing page number and text
        """
        pages = []
        
        try:
            # Open the PDF
            pdf_document = fitz.open(file_path)
            
            # Extract text from each page
            for page_num, page in enumerate(pdf_document):
                text = page.get_text()
                if text.strip():  # Only add non-empty pages
                    pages.append({
                        "page_number": page_num + 1,
                        "text": text
                    })
            
            pdf_document.close()
            
        except Exception as e:
            print(f"Error extracting text: {str(e)}")
            
        return pages
    
    def smart_chunking(self, document_id: str, pages: List[Dict[str, Any]]) -> List[ChunkMetadata]:
        """
        Perform smart chunking on the extracted text
        
        Args:
            document_id: The document ID
            pages: List of dictionaries containing page number and text
            
        Returns:
            List of ChunkMetadata objects
        """
        chunks = []
        chunk_index = 0
        
        for page in pages:
            page_number = page["page_number"]
            text = page["text"]
            
            # Split text into paragraphs
            paragraphs = [p for p in text.split('\n\n') if p.strip()]
            
            current_chunk = ""
            current_chunk_metadata = {
                "page_number": page_number,
                "paragraphs": []
            }
            
            for paragraph in paragraphs:
                # If adding this paragraph would exceed max chunk size and we already have content,
                # save the current chunk and start a new one
                if len(current_chunk) + len(paragraph) > self.max_chunk_size and current_chunk:
                    # Save the current chunk
                    chunk_id = f"{document_id}_{chunk_index}"
                    chunk_metadata = ChunkMetadata(
                        document_id=uuid.UUID(document_id),
                        chunk_id=chunk_id,
                        page_number=page_number,
                        chunk_index=chunk_index,
                        text_length=len(current_chunk),
                        metadata=current_chunk_metadata
                    )
                    chunks.append(chunk_metadata)
                    
                    # Start a new chunk with overlap
                    if current_chunk_metadata["paragraphs"]:
                        # Add the last few paragraphs for context overlap
                        overlap_paragraphs = current_chunk_metadata["paragraphs"][-2:] if len(current_chunk_metadata["paragraphs"]) > 2 else current_chunk_metadata["paragraphs"]
                        current_chunk = "\n\n".join(overlap_paragraphs) + "\n\n"
                        current_chunk_metadata = {
                            "page_number": page_number,
                            "paragraphs": overlap_paragraphs.copy()
                        }
                    else:
                        current_chunk = ""
                        current_chunk_metadata = {
                            "page_number": page_number,
                            "paragraphs": []
                        }
                    
                    chunk_index += 1
                
                # Add paragraph to current chunk
                current_chunk += paragraph + "\n\n"
                current_chunk_metadata["paragraphs"].append(paragraph)
                
                # If this single paragraph is larger than max_chunk_size, we need to split it
                if len(paragraph) > self.max_chunk_size:
                    # Split into sentences
                    sentences = [s.strip() + "." for s in paragraph.split('.') if s.strip()]
                    
                    sentence_chunk = ""
                    sentence_chunk_metadata = {
                        "page_number": page_number,
                        "sentences": []
                    }
                    
                    for sentence in sentences:
                        if len(sentence_chunk) + len(sentence) > self.max_chunk_size and sentence_chunk:
                            # Save the current sentence chunk
                            chunk_id = f"{document_id}_{chunk_index}"
                            chunk_metadata = ChunkMetadata(
                                document_id=uuid.UUID(document_id),
                                chunk_id=chunk_id,
                                page_number=page_number,
                                chunk_index=chunk_index,
                                text_length=len(sentence_chunk),
                                metadata=sentence_chunk_metadata
                            )
                            chunks.append(chunk_metadata)
                            
                            # Start a new chunk
                            sentence_chunk = ""
                            sentence_chunk_metadata = {
                                "page_number": page_number,
                                "sentences": []
                            }
                            
                            chunk_index += 1
                        
                        # Add sentence to current chunk
                        sentence_chunk += sentence + " "
                        sentence_chunk_metadata["sentences"].append(sentence)
                    
                    # Save any remaining sentence chunk
                    if sentence_chunk:
                        chunk_id = f"{document_id}_{chunk_index}"
                        chunk_metadata = ChunkMetadata(
                            document_id=uuid.UUID(document_id),
                            chunk_id=chunk_id,
                            page_number=page_number,
                            chunk_index=chunk_index,
                            text_length=len(sentence_chunk),
                            metadata=sentence_chunk_metadata
                        )
                        chunks.append(chunk_metadata)
                        chunk_index += 1
            
            # Save any remaining chunk from this page
            if current_chunk and len(current_chunk) >= self.min_chunk_size:
                chunk_id = f"{document_id}_{chunk_index}"
                chunk_metadata = ChunkMetadata(
                    document_id=uuid.UUID(document_id),
                    chunk_id=chunk_id,
                    page_number=page_number,
                    chunk_index=chunk_index,
                    text_length=len(current_chunk),
                    metadata=current_chunk_metadata
                )
                chunks.append(chunk_metadata)
                chunk_index += 1
        
        return chunks
    
    def get_chunk_text(self, document_id: str, file_path: str, chunk_metadata: ChunkMetadata) -> str:
        """
        Get the actual text content for a chunk
        
        Args:
            document_id: The document ID
            file_path: Path to the PDF file
            chunk_metadata: Metadata for the chunk
            
        Returns:
            The text content of the chunk
        """
        try:
            # Open the PDF
            pdf_document = fitz.open(file_path)
            
            # Get the page
            page = pdf_document[chunk_metadata.page_number - 1]
            
            # If we have paragraph information, reconstruct from that
            if "paragraphs" in chunk_metadata.metadata:
                text = "\n\n".join(chunk_metadata.metadata["paragraphs"])
            # If we have sentence information, reconstruct from that
            elif "sentences" in chunk_metadata.metadata:
                text = " ".join(chunk_metadata.metadata["sentences"])
            # Otherwise, get the whole page text and try to extract the relevant portion
            else:
                text = page.get_text()
            
            pdf_document.close()
            return text
            
        except Exception as e:
            print(f"Error getting chunk text: {str(e)}")
            return ""
    
    def process_document(self, file_content: bytes, filename: str) -> Tuple[DocumentMetadata, List[ChunkMetadata]]:
        """
        Process a document: save, extract metadata and text, and chunk the text
        
        Args:
            file_content: The binary content of the file
            filename: Original filename
            
        Returns:
            Tuple containing DocumentMetadata and list of ChunkMetadata
        """
        # Save the document
        document_id, file_path = self.save_document(file_content, filename)
        
        # Extract metadata
        metadata = self.extract_metadata(file_path, filename)
        
        # Extract text
        pages = self.extract_text(file_path)
        
        # Update metadata with page count
        metadata.page_count = len(pages)
        
        # Perform smart chunking
        chunks = self.smart_chunking(document_id, pages)
        
        # Update metadata status
        metadata.status = "completed"
        metadata.updated_at = datetime.now()
        
        return metadata, chunks
