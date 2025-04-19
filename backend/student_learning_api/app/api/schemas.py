# app/api/schemas.py
from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import datetime
from typing import List, Dict, Any, Optional
import re

class StudentCreate(BaseModel):
    """Schema for creating a new student"""
    name: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    preferences: Dict[str, Any] = Field(default_factory=dict)

    @field_validator('name')
    @classmethod
    def name_must_be_valid(cls, v):
        if not re.match(r'^[a-zA-Z0-9\s\-\']+$', v):
            raise ValueError("Name contains invalid characters")
        return v

class StudentResponse(BaseModel):
    """Schema for student response"""
    id: str
    name: str
    email: str
    enrolled_courses: List[str] = []
    created_at: datetime
    last_login: Optional[datetime] = None

class ProgressUpdate(BaseModel):
    """Schema for updating student progress"""
    topic_id: str
    completion_status: float = Field(..., ge=0, le=100)
    metrics: Optional[Dict[str, Any]] = None

    @field_validator('metrics')
    @classmethod
    def validate_metrics(cls, v):
        if v is not None:
            required_fields = ['time_spent', 'attempts']
            for field in required_fields:
                if field not in v:
                    raise ValueError(f"Missing required metric: {field}")
        return v

class TopicCreate(BaseModel):
    """Schema for creating a new topic"""
    name: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = None
    dependencies: List[str] = []
    difficulty_level: int = Field(1, ge=1, le=5)
    estimated_duration: int = Field(0, ge=0)
    tags: List[str] = []

class TopicResponse(BaseModel):
    """Schema for topic response"""
    id: str
    name: str
    description: Optional[str]
    dependencies: List[str]
    difficulty_level: int
    estimated_duration: int
    tags: List[str]
    created_at: datetime

class LearningPathCreate(BaseModel):
    """Schema for creating a learning path"""
    name: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = None
    topics: List[Dict[str, Any]] = []

    @field_validator('topics')
    @classmethod
    def validate_topics(cls, v):
        if not v:
            raise ValueError("Learning path must contain at least one topic")
        for i, topic in enumerate(v):
            if 'topic_id' not in topic:
                raise ValueError(f"Topic at position {i} missing topic_id")
        return v

class LearningPathResponse(BaseModel):
    """Schema for learning path response"""
    id: str
    name: str
    description: Optional[str]
    topics: List[Dict[str, Any]]
    created_at: datetime

class RecommendationResponse(BaseModel):
    """Schema for topic recommendations"""
    id: str
    name: str
    description: Optional[str]
    difficulty_level: int
    estimated_duration: int
    relevance_score: float
    predicted_completion_time: Optional[int] = None
