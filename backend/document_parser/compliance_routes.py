import os
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, Body
from fastapi.responses import JSONResponse
from uuid import UUID
import time

from document_storage import DocumentStorage
from mongodb_manager import MongoDBManager
from auth_routes import get_current_active_user, UserInDB

router = APIRouter()
mongodb_manager = MongoDBManager()


async def get_storage():
    """Dependency to get initialized document storage"""
    await document_storage.initialize()
    return document_storage


@router.get("/compliance/data-retention-policy")
async def get_data_retention_policy(
    current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Get the data retention policy
    
    Returns:
        Data retention policy details
    """
    # This would typically be stored in a database or configuration file
    # Here we're hardcoding for demonstration
    return {
        "policy_name": "Indian Data Retention Policy",
        "version": "1.0",
        "last_updated": "2025-04-01",
        "retention_periods": {
            "documents": "7 years",
            "user_data": "3 years after account closure",
            "audit_logs": "5 years",
            "search_history": "1 year"
        },
        "legal_basis": "Information Technology Act, 2000 and Personal Data Protection Bill",
        "contact_email": "compliance@example.com"
    }


@router.post("/compliance/data-export/{user_id}")
async def export_user_data(
    user_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    storage: DocumentStorage = Depends(get_storage)
):
    """
    Export all data related to a specific user
    
    Args:
        user_id: User ID
        
    Returns:
        Status of export request
    """
    # Check if requesting user is admin or the user themselves
    if current_user.role != "admin" and current_user.username != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to export this user's data")
    
    # This would typically trigger a background job to gather and package all user data
    # Here we're just returning a mock response
    
    # Log the export request
    await mongodb_manager.log_audit_event(
        user_id=current_user.username,
        action="data_export_request",
        details={"target_user": user_id}
    )
    
    return {
        "status": "processing",
        "request_id": str(UUID(bytes=os.urandom(16))),
        "estimated_completion_time": "24 hours",
        "notification_method": "email"
    }


@router.post("/compliance/data-deletion-request/{user_id}")
async def request_data_deletion(
    user_id: str,
    reason: str = Body(...),
    current_user: UserInDB = Depends(get_current_active_user),
    storage: DocumentStorage = Depends(get_storage)
):
    """
    Request deletion of all data related to a specific user
    
    Args:
        user_id: User ID
        reason: Reason for deletion request
        
    Returns:
        Status of deletion request
    """
    # Check if requesting user is admin or the user themselves
    if current_user.role != "admin" and current_user.username != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to request deletion for this user")
    
    # This would typically trigger a background job to delete all user data
    # Here we're just returning a mock response
    
    # Log the deletion request
    await mongodb_manager.log_audit_event(
        user_id=current_user.username,
        action="data_deletion_request",
        details={"target_user": user_id, "reason": reason}
    )
    
    return {
        "status": "processing",
        "request_id": str(UUID(bytes=os.urandom(16))),
        "estimated_completion_time": "30 days",
        "notification_method": "email"
    }


@router.get("/compliance/audit-trail/{document_id}")
async def get_document_audit_trail(
    document_id: UUID,
    current_user: UserInDB = Depends(get_current_active_user),
    storage: DocumentStorage = Depends(get_storage)
):
    """
    Get audit trail for a specific document
    
    Args:
        document_id: Document ID
        
    Returns:
        Audit trail for the document
    """
    # Check if document exists
    document = await storage.get_document_metadata(str(document_id))
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Get audit logs for this document
    logs = await mongodb_manager.get_audit_logs({"document_id": str(document_id)})
    
    # Log this access
    await mongodb_manager.log_audit_event(
        user_id=current_user.username,
        action="view_audit_trail",
        document_id=str(document_id)
    )
    
    return {"audit_trail": logs}


@router.get("/system/health")
async def system_health_check(
    current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Check system health and performance metrics
    
    Returns:
        System health and performance metrics
    """
    # This would typically check various system components
    # Here we're just returning mock metrics
    
    return {
        "status": "healthy",
        "components": {
            "api": {"status": "up", "response_time_ms": 42},
            "mongodb": {"status": "up", "connection_pool": "stable"},
            "chromadb": {"status": "up", "index_health": "optimal"},
            "ollama": {"status": "up", "model_loaded": True},
            "file_storage": {"status": "up", "free_space_gb": 128}
        },
        "performance_metrics": {
            "requests_per_minute": 120,
            "average_response_time_ms": 150,
            "concurrent_users": 25,
            "cpu_usage_percent": 35,
            "memory_usage_percent": 42
        },
        "timestamp": time.time()
    }


@router.get("/system/rate-limits")
async def get_rate_limits(
    current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Get current rate limits for the API
    
    Returns:
        Current rate limits
    """
    # Rate limits would typically be stored in a database or configuration file
    # Here we're hardcoding for demonstration
    
    # Different rate limits based on user role
    if current_user.role == "admin":
        limits = {
            "uploads_per_day": 1000,
            "queries_per_minute": 100,
            "rag_queries_per_minute": 50,
            "max_document_size_mb": 50
        }
    else:
        limits = {
            "uploads_per_day": 100,
            "queries_per_minute": 30,
            "rag_queries_per_minute": 10,
            "max_document_size_mb": 16
        }
    
    return {
        "user_role": current_user.role,
        "rate_limits": limits,
        "current_usage": {
            "uploads_today": 12,
            "queries_this_minute": 5,
            "rag_queries_this_minute": 2
        }
    }
