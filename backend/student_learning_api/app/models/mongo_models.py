from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from bson import ObjectId
import re
from typing_extensions import TypedDict
from pydantic import GetCoreSchemaHandler
from pydantic_core import core_schema


# --- Custom ObjectId Type Compatible with Pydantic v2 ---
class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(cls, source_type: Any, handler: GetCoreSchemaHandler) -> core_schema.CoreSchema:
        return core_schema.no_info_plain_validator_function(cls._validate, serialization=core_schema.plain_serializer_function_ser_schema(str))

    @classmethod
    def _validate(cls, value):
        if isinstance(value, ObjectId):
            return value
        if isinstance(value, str) and ObjectId.is_valid(value):
            return ObjectId(value)
        raise ValueError(f"Invalid ObjectId: {value}")


# --- TypedDict for Learning Metrics ---
class LearningMetrics(TypedDict):
    time_spent: int
    attempts: int
    correct_answers: int
    engagement_score: float


# --- Student Progress Model ---
class StudentProgress(BaseModel):
    topic_id: PyObjectId
    completion_status: float = Field(..., ge=0, le=100)
    last_accessed: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    metrics: Optional[LearningMetrics] = None
    prediction_data: Optional[Dict[str, Any]] = None

    @field_validator('metrics')
    @classmethod
    def validate_metrics(cls, v):
        if v and v.get('engagement_score') is not None:
            if not 0 <= v['engagement_score'] <= 10:
                raise ValueError("Engagement score must be between 0 and 10")
        return v

    model_config = {
        "populate_by_name": True,
        "json_encoders": {ObjectId: str},
    }


# --- Base Student Model ---
class StudentBase(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    name: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    enrolled_courses: List[PyObjectId] = []
    progress: List[StudentProgress] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login: Optional[datetime] = None
    preferences: Dict[str, Any] = {}
    learning_path_id: Optional[PyObjectId] = None

    @field_validator('email')
    @classmethod
    def email_must_be_valid(cls, v):
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, v):
            raise ValueError("Invalid email format")
        return v.lower()

    model_config = {
        "populate_by_name": True,
        "json_encoders": {ObjectId: str},
    }


# --- Topic Model ---
class TopicBase(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    name: str = Field(..., min_length=3, max_length=100)
    description: Optional[str]
    dependencies: List[PyObjectId] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    difficulty_level: int = Field(1, ge=1, le=5)
    estimated_duration: int = Field(0, ge=0)
    tags: List[str] = []

    model_config = {
        "populate_by_name": True,
        "json_encoders": {ObjectId: str},
    }


# --- Learning Path Model ---
class LearningPath(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    name: str = Field(..., min_length=3, max_length=100)
    description: Optional[str]
    topics: List[Dict[str, Any]] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {
        "populate_by_name": True,
        "json_encoders": {ObjectId: str},
    }
