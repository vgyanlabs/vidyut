# model_test.py

from app.models.mongo_models import StudentBase, PyObjectId, StudentProgress, LearningMetrics
from datetime import datetime, timezone

# Simulate a student record
student = StudentBase(
    name="Alice Wonderland",
    email="alice@example.com",
    enrolled_courses=[PyObjectId()],
    progress=[
        StudentProgress(
            topic_id=PyObjectId(),
            completion_status=75.0,
            last_accessed=datetime.now(timezone.utc),
            metrics=LearningMetrics(
                time_spent=3600,
                attempts=3,
                correct_answers=2,
                engagement_score=8.5
            )
        )
    ],
    preferences={"theme": "dark"},
)

print(student.model_dump_json(indent=2))
