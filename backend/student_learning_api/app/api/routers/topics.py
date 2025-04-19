from fastapi import APIRouter

router = APIRouter()

@router.get("/topics/ping", tags=["topics"])
async def ping_topics():
    return {"msg": "Topics router is working"}
