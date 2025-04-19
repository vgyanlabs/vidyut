from fastapi import APIRouter

router = APIRouter()

@router.get("/learning-paths/ping", tags=["learning-paths"])
async def ping_learning_paths():
    return {"msg": "Learning Paths router is working"}
