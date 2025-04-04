import os
from typing import List, Dict, Any, Optional
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_community.llms import Ollama
from langchain_core.runnables import RunnablePassthrough
from langchain_chroma import ChromaVectorStore
from langchain_core.documents import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import OllamaEmbeddings
import chromadb

import config
from models import RAGQuery, RAGResponse


class RAGEngine:
    """
    Class for handling RAG (Retrieval Augmented Generation) operations
    using LangChain and Ollama
    """
    
    def __init__(self):
        """Initialize the RAG engine"""
        # Initialize Ollama LLM
        self.llm = Ollama(
            model=config.OLLAMA_MODEL,
            base_url=config.OLLAMA_BASE_URL,
            temperature=0.7
        )
        
        # Initialize embeddings
        self.embeddings = OllamaEmbeddings(
            model_name=config.EMBEDDING_MODEL_NAME,
            base_url=config.OLLAMA_BASE_URL
        )
        
        # Initialize ChromaDB client
        self.chroma_client = chromadb.PersistentClient(
            path=config.CHROMA_PERSIST_DIRECTORY
        )
        
        # Get or create collection
        self.chroma_collection = self.chroma_client.get_or_create_collection(
            name="document_chunks"
        )
        
        # Create vector store
        self.vector_store = ChromaVectorStore(
            client=self.chroma_client,
            collection_name="document_chunks",
            embedding_function=self.embeddings
        )
        
        # Create text splitter for preprocessing
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=config.CHUNK_SIZE,
            chunk_overlap=config.CHUNK_OVERLAP
        )
        
        # Define RAG prompt template
        self.rag_prompt = ChatPromptTemplate.from_template("""
        You are an AI assistant that answers questions based on the provided context.
        
        Context:
        {context}
        
        Question:
        {question}
        
        Instructions:
        - Answer the question based only on the provided context
        - If the context doesn't contain the answer, say "I don't have enough information to answer this question"
        - Provide specific references to the source documents where possible
        - Be concise and clear in your response
        - Format your answer in a readable way
        
        Answer:
        """)
    
    def _format_docs(self, docs: List[Document]) -> str:
        """
        Format documents for inclusion in prompt
        
        Args:
            docs: List of documents
            
        Returns:
            Formatted string
        """
        return "\n\n".join(f"Document {i+1}:\n{doc.page_content}" for i, doc in enumerate(docs))
    
    def process_query(self, query: RAGQuery) -> RAGResponse:
        """
        Process a RAG query
        
        Args:
            query: RAG query
            
        Returns:
            RAG response
        """
        try:
            # Prepare retriever with filters if provided
            retriever = self.vector_store.as_retriever(
                search_kwargs={
                    "k": query.max_chunks,
                    "filter": query.filters if query.filters else None
                }
            )
            
            # Create RAG chain
            rag_chain = (
                {"context": retriever | self._format_docs, "question": RunnablePassthrough()}
                | self.rag_prompt
                | self.llm
                | StrOutputParser()
            )
            
            # Execute chain
            answer = rag_chain.invoke(query.query)
            
            # Get retrieved documents for source attribution
            retrieved_docs = retriever.invoke(query.query)
            sources = []
            
            for doc in retrieved_docs:
                if hasattr(doc, 'metadata') and doc.metadata:
                    sources.append({
                        "document_id": doc.metadata.get("document_id", ""),
                        "page_number": doc.metadata.get("page_number", ""),
                        "chunk_id": doc.metadata.get("chunk_id", ""),
                        "score": doc.metadata.get("score", 0.0),
                        "title": doc.metadata.get("title", "")
                    })
            
            # Create response
            response = RAGResponse(
                answer=answer,
                sources=sources,
                metadata={
                    "model": config.OLLAMA_MODEL,
                    "temperature": query.temperature,
                    "max_chunks": query.max_chunks
                }
            )
            
            return response
        
        except Exception as e:
            print(f"Error processing RAG query: {str(e)}")
            # Return error response
            return RAGResponse(
                answer=f"Error processing your query: {str(e)}",
                sources=[],
                metadata={"error": str(e)}
            )
    
    def summarize_document(self, document_text: str, max_length: int = 500) -> str:
        """
        Generate a summary of a document
        
        Args:
            document_text: Document text to summarize
            max_length: Maximum length of summary
            
        Returns:
            Document summary
        """
        try:
            # Create summarization prompt
            summary_prompt = ChatPromptTemplate.from_template("""
            Please provide a concise summary of the following document. 
            The summary should be no more than {max_length} words and should capture the main points and key information.
            
            Document:
            {document}
            
            Summary:
            """)
            
            # Create summarization chain
            summary_chain = (
                summary_prompt 
                | self.llm 
                | StrOutputParser()
            )
            
            # Execute chain
            summary = summary_chain.invoke({
                "document": document_text[:10000],  # Limit input size
                "max_length": max_length
            })
            
            return summary
        
        except Exception as e:
            print(f"Error summarizing document: {str(e)}")
            return f"Error generating summary: {str(e)}"
    
    def extract_key_points(self, document_text: str, max_points: int = 10) -> List[str]:
        """
        Extract key points from a document
        
        Args:
            document_text: Document text to analyze
            max_points: Maximum number of key points to extract
            
        Returns:
            List of key points
        """
        try:
            # Create key points extraction prompt
            key_points_prompt = ChatPromptTemplate.from_template("""
            Please extract the {max_points} most important key points from the following document.
            Each key point should be a single sentence that captures an important fact, finding, or conclusion.
            
            Document:
            {document}
            
            Key Points (one per line):
            """)
            
            # Create key points extraction chain
            key_points_chain = (
                key_points_prompt 
                | self.llm 
                | StrOutputParser()
            )
            
            # Execute chain
            key_points_text = key_points_chain.invoke({
                "document": document_text[:10000],  # Limit input size
                "max_points": max_points
            })
            
            # Split into list
            key_points = [point.strip() for point in key_points_text.split('\n') if point.strip()]
            
            return key_points
        
        except Exception as e:
            print(f"Error extracting key points: {str(e)}")
            return [f"Error extracting key points: {str(e)}"]
    
    def smart_chunk_text(self, text: str) -> List[Document]:
        """
        Perform smart chunking on text using LLM assistance
        
        Args:
            text: Text to chunk
            
        Returns:
            List of Document objects
        """
        try:
            # First pass: basic chunking with text splitter
            basic_chunks = self.text_splitter.split_text(text)
            documents = []
            
            # Second pass: LLM-assisted chunking for important chunks
            for i, chunk in enumerate(basic_chunks):
                # Create chunk analysis prompt
                chunk_analysis_prompt = ChatPromptTemplate.from_template("""
                Analyze the following text chunk and determine if it contains important information.
                If it does, improve the chunk by making it more self-contained and coherent.
                If it doesn't contain important information, respond with "SKIP".
                
                Text Chunk:
                {chunk}
                
                Improved Chunk (or "SKIP"):
                """)
                
                # Create chunk analysis chain
                chunk_analysis_chain = (
                    chunk_analysis_prompt 
                    | self.llm 
                    | StrOutputParser()
                )
                
                # Execute chain
                result = chunk_analysis_chain.invoke({"chunk": chunk})
                
                # Process result
                if result.strip() != "SKIP":
                    # Create document with metadata
                    doc = Document(
                        page_content=result,
                        metadata={
                            "chunk_index": i,
                            "original_chunk": chunk[:100] + "..." if len(chunk) > 100 else chunk,
                            "is_enhanced": True if result != chunk else False
                        }
                    )
                    documents.append(doc)
            
            return documents
        
        except Exception as e:
            print(f"Error performing smart chunking: {str(e)}")
            # Fall back to basic chunking
            return [Document(page_content=chunk) for chunk in self.text_splitter.split_text(text)]
