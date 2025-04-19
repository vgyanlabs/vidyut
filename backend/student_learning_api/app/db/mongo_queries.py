from app.models.mongo_models import StudentBase, TopicBase, StudentProgress, LearningPath
from app.db.mongo_connection import mongodb
from bson import ObjectId
from typing import List, Dict, Any, Optional
import logging
from datetime import datetime, timedelta

class StudentQueries:
    """Advanced student queries with optimized aggregation pipelines"""
    logger = logging.getLogger("student_queries")
    
    @staticmethod
    async def get_student_with_progress(student_id: str):
        """Get student with detailed progress using optimized aggregation"""
        # REMEMBER: Aggregation pipelines are powerful for complex data retrieval
        pipeline = [
            {"$match": {"_id": ObjectId(student_id)}},
            {"$lookup": {
                "from": "topics",
                "localField": "progress.topic_id",
                "foreignField": "_id",
                "as": "topic_details"
            }},
            {"$project": {
                "name": 1,
                "email": 1,
                "enrolled_courses": 1,
                "last_login": 1,
                "progress": {
                    "$map": {
                        "input": "$progress",
                        "as": "p",
                        "in": {
                            "completion_status": "$$p.completion_status",
                            "last_accessed": "$$p.last_accessed",
                            "metrics": "$$p.metrics",
                            "topic": {
                                "$arrayElemAt": [
                                    "$topic_details",
                                    {"$indexOfArray": ["$topic_details._id", "$$p.topic_id"]}
                                ]
                            }
                        }
                    }
                }
            }}
        ]
        result = await mongodb.db.students.aggregate(pipeline).to_list(1)
        StudentQueries.logger.info(f"Retrieved student progress for ID: {student_id}")
        return result
    
    @staticmethod
    async def get_recommended_topics(student_id: str, limit: int = 5):
        """Advanced recommendation algorithm based on student progress and preferences"""
        # REMEMBER: This is a simplified recommendation algorithm
        # In production, you might use more sophisticated ML models
        
        # Get student data
        student = await mongodb.db.students.find_one({"_id": ObjectId(student_id)})
        if not student:
            return []
            
        # Extract completed topics
        completed_topic_ids = [
            p["topic_id"] for p in student.get("progress", []) 
            if p.get("completion_status", 0) > 80
        ]
        
        # Find topics that depend on completed topics but aren't started yet
        pipeline = [
            {"$match": {
                "dependencies": {"$in": [ObjectId(tid) for tid in completed_topic_ids]},
                "_id": {"$nin": [ObjectId(tid) for tid in completed_topic_ids]}
            }},
            {"$addFields": {
                "relevance_score": {
                    "$sum": [
                        # More dependencies matched = higher score
                        {"$size": {"$setIntersection": ["$dependencies", [ObjectId(tid) for tid in completed_topic_ids]]}},
                        # Adjust for difficulty level (slight preference for appropriate difficulty)
                        {"$cond": [
                            {"$and": [
                                {"$gte": ["$difficulty_level", student.get("preferences", {}).get("preferred_difficulty", 3) - 1]},
                                {"$lte": ["$difficulty_level", student.get("preferences", {}).get("preferred_difficulty", 3) + 1]}
                            ]},
                            2,
                            0
                        ]}
                    ]
                }
            }},
            {"$sort": {"relevance_score": -1}},
            {"$limit": limit}
        ]
        
        recommendations = await mongodb.db.topics.aggregate(pipeline).to_list(None)
        StudentQueries.logger.info(f"Generated {len(recommendations)} topic recommendations for student {student_id}")
        return recommendations
    
    @staticmethod
    async def predict_completion_time(student_id: str, topic_id: str) -> Optional[int]:
        """Predict estimated completion time based on student history"""
        # This would integrate with a machine learning model in production
        # Here we're using a simplified heuristic approach
        
        student = await mongodb.db.students.find_one({"_id": ObjectId(student_id)})
        topic = await mongodb.db.topics.find_one({"_id": ObjectId(topic_id)})
        
        if not student or not topic:
            return None
            
        # Get average completion time for similar difficulty topics
        similar_progress = [
            p for p in student.get("progress", [])
            if p.get("metrics", {}).get("time_spent") is not None
        ]
        
        if not similar_progress:
            # Fall back to topic's estimated duration
            return topic.get("estimated_duration", 30)
            
        # Calculate average time spent per difficulty level
        total_time = sum(p.get("metrics", {}).get("time_spent", 0) for p in similar_progress)
        avg_time_per_topic = total_time / len(similar_progress)
        
        # Adjust based on topic difficulty
        difficulty_factor = topic.get("difficulty_level", 3) / 3
        
        # Predict minutes to complete
        predicted_minutes = int(avg_time_per_topic / 60 * difficulty_factor)
        
        # Ensure reasonable bounds
        return max(10, min(predicted_minutes, 120))

class TopicQueries:
    """Advanced topic queries with analytics capabilities"""
    logger = logging.getLogger("topic_queries")
    
    @staticmethod
    async def get_popular_topics(limit: int = 10, time_period_days: int = 30):
        """Get popular topics with engagement metrics"""
        # Calculate the date threshold
        date_threshold = datetime.utcnow() - timedelta(days=time_period_days)
        
        pipeline = [
            # Match topics with recent activity
            {"$lookup": {
                "from": "students",
                "let": {"topic_id": "$_id"},
                "pipeline": [
                    {"$match": {
                        "$expr": {"$in": ["$$topic_id", "$progress.topic_id"]},
                        "progress.last_accessed": {"$gte": date_threshold}
                    }}
                ],
                "as": "recent_students"
            }},
            # Calculate engagement metrics
            {"$addFields": {
                "student_count": {"$size": "$recent_students"},
                "avg_completion": {
                    "$avg": {
                        "$map": {
                            "input": "$recent_students",
                            "as": "student",
                            "in": {
                                "$let": {
                                    "vars": {
                                        "progress_item": {
                                            "$arrayElemAt": [
                                                {"$filter": {
                                                    "input": "$$student.progress",
                                                    "as": "p",
                                                    "cond": {"$eq": ["$$p.topic_id", "$$topic_id"]}
                                                }},
                                                0
                                            ]
                                        }
                                    },
                                    "in": "$$progress_item.completion_status"
                                }
                            }
                        }
                    }
                }
            }},
            # Sort by popularity (student count and completion rate)
            {"$sort": {"student_count": -1, "avg_completion": -1}},
            {"$limit": limit},
            # Project only needed fields
            {"$project": {
                "_id": 1,
                "name": 1,
                "description": 1,
                "difficulty_level": 1,
                "tags": 1,
                "student_count": 1,
                "avg_completion": 1
            }}
        ]
        
        popular_topics = await mongodb.db.topics.aggregate(pipeline).to_list(None)
        TopicQueries.logger.info(f"Retrieved {len(popular_topics)} popular topics for the last {time_period_days} days")
        return popular_topics
    
    @staticmethod
    async def get_topic_dependency_graph(root_topic_id: str = None):
        """Generate a topic dependency graph for visualization"""
        match_stage = {} if root_topic_id is None else {"_id": ObjectId(root_topic_id)}
        
        pipeline = [
            {"$match": match_stage},
            {"$graphLookup": {
                "from": "topics",
                "startWith": "$dependencies",
                "connectFromField": "dependencies",
                "connectToField": "_id",
                "as": "prerequisite_chain",
                "maxDepth": 5
            }},
            {"$project": {
                "_id": 1,
                "name": 1,
                "dependencies": 1,
                "prerequisite_chain._id": 1,
                "prerequisite_chain.name": 1,
                "prerequisite_chain.dependencies": 1
            }}
        ]
        
        dependency_graph = await mongodb.db.topics.aggregate(pipeline).to_list(None)
        return dependency_graph

class LearningPathQueries:
    """Queries for adaptive learning paths"""
    logger = logging.getLogger("learning_path_queries")
    
    @staticmethod
    async def get_next_topic_in_path(student_id: str, path_id: str):
        """Get the next recommended topic in a learning path"""
        student = await mongodb.db.students.find_one({"_id": ObjectId(student_id)})
        path = await mongodb.db.learning_paths.find_one({"_id": ObjectId(path_id)})
        
        if not student or not path:
            return None
            
        # Get completed topic IDs
        completed_topic_ids = set(
            str(p["topic_id"]) for p in student.get("progress", []) 
            if p.get("completion_status", 0) > 80
        )
        
        # Find first uncompleted topic in path
        for topic_entry in path.get("topics", []):
            topic_id = str(topic_entry["topic_id"])
            
            # Skip completed topics
            if topic_id in completed_topic_ids:
                continue
                
            # Check if prerequisites are met
            prerequisites = topic_entry.get("prerequisites", [])
            if all(str(prereq) in completed_topic_ids for prereq in prerequisites):
                # Get full topic details
                topic = await mongodb.db.topics.find_one({"_id": ObjectId(topic_id)})
                return topic
                
        # All topics completed or prerequisites not met
        return None