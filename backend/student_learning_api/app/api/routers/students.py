from fastapi import APIRouter, Depends, HTTPException, Query, Path, BackgroundTasks
from app.api.schemas import StudentCreate, StudentResponse, ProgressUpdate
from app.db.mongo_queries import StudentQueries
from app.api.dependencies import get_db, get_cache_manager, rate_limit, CacheManager
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from pymongo.errors import DuplicateKeyError
import json
import logging
from datetime import datetime, timezone
from typing import List, Optional
from app.utils.monitoring import monitor_performance

router = APIRouter(prefix="/students", tags=["students"])
logger = logging.getLogger("students_router")


# Background task for analytics
async def record_student_activity(db: AsyncIOMotorDatabase, student_id: str, action: str):
    """Record student activity for analytics"""
    await db.student_activities.insert_one({
        "student_id": ObjectId(student_id),
        "action": action,
        "timestamp": datetime.now(timezone.utc)
    })
    logger.info(f"Recorded student activity: {student_id} - {action}")


@router.post("/", response_model=StudentResponse, dependencies=[Depends(rate_limit)])
@monitor_performance
async def create_student(
    student: StudentCreate, 
    db: AsyncIOMotorDatabase = Depends(get_db),
    cache_manager: CacheManager = Depends(get_cache_manager)
):
    """Create a new student"""
    try:
        student_dict = student.model_dump()
        student_dict["created_at"] = datetime.now(timezone.utc)
        student_dict["last_login"] = datetime.now(timezone.utc)
        
        result = await db.students.insert_one(student_dict)
        await cache_manager.invalidate_cache("students:list:*")
        
        created_student = {
            **student_dict,
            "id": str(result.inserted_id)
        }
        logger.info(f"Created new student: {created_student['id']}")
        return created_student
        
    except DuplicateKeyError:
        logger.warning(f"Attempted to create student with duplicate email: {student.email}")
        raise HTTPException(status_code=400, detail="Email already exists")
    except Exception as e:
        logger.error(f"Error creating student: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create student")


@router.get("/{student_id}", response_model=StudentResponse, dependencies=[Depends(rate_limit)])
@monitor_performance
async def get_student(
    student_id: str = Path(..., title="The ID of the student to get"),
    db: AsyncIOMotorDatabase = Depends(get_db),
    cache_manager: CacheManager = Depends(get_cache_manager),
    background_tasks: BackgroundTasks = None
):
    """Get a student by ID"""
    cache_key = f"students:detail:{student_id}"
    cached_data = await cache_manager.get_cached_data(cache_key)
    
    if cached_data:
        if background_tasks:
            background_tasks.add_task(
                record_student_activity, db, student_id, "profile_viewed_cached"
            )
        return json.loads(cached_data)
    
    try:
        student = await db.students.find_one({"_id": ObjectId(student_id)})
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        if background_tasks:
            background_tasks.add_task(
                record_student_activity, db, student_id, "profile_viewed"
            )
        
        response = {
            "id": str(student["_id"]),
            "name": student["name"],
            "email": student["email"],
            "enrolled_courses": [str(course_id) for course_id in student.get("enrolled_courses", [])],
            "created_at": student["created_at"],
            "last_login": student.get("last_login")
        }
        
        await cache_manager.set_cached_data(cache_key, json.dumps(response), 300)
        return response
        
    except Exception as e:
        logger.error(f"Error retrieving student {student_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve student")


@router.patch("/{student_id}/progress", dependencies=[Depends(rate_limit)])
async def update_progress(
    progress: ProgressUpdate,
    student_id: str = Path(..., title="The ID of the student to update"),
    db: AsyncIOMotorDatabase = Depends(get_db),
    cache_manager: CacheManager = Depends(get_cache_manager),
    background_tasks: BackgroundTasks = None
):
    """Update student progress on a topic"""
    try:
        student = await db.students.find_one({"_id": ObjectId(student_id)})
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        topic = await db.topics.find_one({"_id": ObjectId(progress.topic_id)})
        if not topic:
            raise HTTPException(status_code=404, detail="Topic not found")
        
        progress_data = {
            "topic_id": ObjectId(progress.topic_id),
            "completion_status": progress.completion_status,
            "last_accessed": datetime.now(timezone.utc),
            "metrics": progress.metrics
        }
        
        existing_progress = await db.students.find_one({
            "_id": ObjectId(student_id),
            "progress.topic_id": ObjectId(progress.topic_id)
        })
        
        if existing_progress:
            update_result = await db.students.update_one(
                {
                    "_id": ObjectId(student_id),
                    "progress.topic_id": ObjectId(progress.topic_id)
                },
                {"$set": {
                    "progress.$.completion_status": progress.completion_status,
                    "progress.$.last_accessed": datetime.now(timezone.utc),
                    "progress.$.metrics": progress.metrics
                }}
            )
        else:
            update_result = await db.students.update_one(
                {"_id": ObjectId(student_id)},
                {"$push": {"progress": progress_data}}
            )
        
        if background_tasks:
            background_tasks.add_task(
                record_student_activity, 
                db, 
                student_id, 
                f"progress_updated:{progress.topic_id}"
            )
        
        await cache_manager.invalidate_cache(f"students:detail:{student_id}")
        await cache_manager.invalidate_cache(f"students:progress:{student_id}*")
        
        if update_result.modified_count == 0:
            logger.warning(f"No changes made to progress for student {student_id}")
            return {"status": "no changes made"}
        
        logger.info(f"Updated progress for student {student_id} on topic {progress.topic_id}")
        return {"status": "progress updated"}
        
    except Exception as e:
        logger.error(f"Error updating progress: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update progress")


@router.get("/{student_id}/recommendations", dependencies=[Depends(rate_limit)])
async def get_recommendations(
    student_id: str = Path(..., title="The ID of the student"),
    limit: int = Query(5, ge=1, le=20),
    db: AsyncIOMotorDatabase = Depends(get_db),
    cache_manager: CacheManager = Depends(get_cache_manager)
):
    """Get personalized topic recommendations for a student"""
    cache_key = f"students:recommendations:{student_id}:{limit}"
    cached_data = await cache_manager.get_cached_data(cache_key)
    
    if cached_data:
        return json.loads(cached_data)
    
    try:
        recommendations = await StudentQueries.get_recommended_topics(student_id, limit)
        
        for recommendation in recommendations:
            recommendation["predicted_completion_time"] = await StudentQueries.predict_completion_time(
                student_id, str(recommendation["_id"])
            )
            recommendation["id"] = str(recommendation.pop("_id"))
        
        await cache_manager.set_cached_data(cache_key, json.dumps(recommendations), 600)
        return recommendations
        
    except Exception as e:
        logger.error(f"Error getting recommendations for student {student_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get recommendations")
