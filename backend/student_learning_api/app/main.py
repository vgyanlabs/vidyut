# app/main.py
from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from app.api.routers import students, topics, learning_paths
from app.db.mongo_connection import mongodb
from app.api.dependencies import rate_limit, get_redis
from app.config import settings

import logging
import time
import redis.asyncio as redis
import json

# Setup logging
logger = logging.getLogger("main")
# Setup logging
logger = logging.getLogger("main")

# Add this block to configure performance logger
performance_logger = logging.getLogger("performance")
performance_logger.setLevel(logging.WARNING)
performance_handler = logging.StreamHandler()
performance_formatter = logging.Formatter(
    "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
performance_handler.setFormatter(performance_formatter)
performance_logger.addHandler(performance_handler)


# Use lifespan for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup tasks
    logger.info("Connecting to MongoDB...")
    await mongodb.connect()
    logger.info("MongoDB connected successfully")
    
    yield  # Application runs here
    
    # Shutdown tasks
    logger.info("Closing MongoDB connection...")
    await mongodb.close()
    logger.info("MongoDB connection closed")

# Create FastAPI app
app = FastAPI(
    title="Student Learning API",
    description="Advanced student state management service with FastAPI and MongoDB",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan  # Pass the context manager here
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Middleware to track request processing time"""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    
    # Log slow requests
    if process_time > 1.0:  # Log requests taking more than 1 second
        logger.warning(f"Slow request: {request.method} {request.url.path} took {process_time:.2f}s")
        
    return response

# Health check endpoint
@app.get("/health", tags=["health"])
async def health_check(redis_client: redis.Redis = Depends(get_redis)):
    """Health check endpoint for monitoring"""
    try:
        # Check MongoDB connection
        db_stats = await mongodb.get_db_stats()
        
        # Check Redis connection
        redis_ping = await redis_client.ping()
        
        return {
            "status": "healthy",
            "mongodb": {
                "status": "connected",
                "collections": db_stats.get("collections", 0),
                "documents": db_stats.get("objects", 0)
            },
            "redis": {
                "status": "connected" if redis_ping else "error"
            },
            "api_version": "1.0.0"
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"status": "unhealthy", "error": str(e)}
        )

# Include routers
app.include_router(
    students.router,
    prefix=settings.API_V1_PREFIX
)
app.include_router(
    topics.router,
    prefix=settings.API_V1_PREFIX
)
app.include_router(
    learning_paths.router,
    prefix=settings.API_V1_PREFIX
)

# Root redirect to docs
@app.get("/")
async def root():
    """Redirect root to API documentation"""
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/api/docs")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
