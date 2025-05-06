from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.endpoints import auth
from app.models.user import Base
from app.core.database import engine

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TeacherAI Auth Service",
    description="""
    Authentication service for TeacherAI platform.
    
    ## Features
    * Google OAuth authentication
    * JWT token generation and validation
    * User management
    
    For testing purposes, you can use the /mock-login endpoint to simulate OAuth flow.
    """,
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix=settings.API_V1_STR + "/auth", tags=["auth"])

@app.get("/health")
def health_check():
    return {"status": "healthy"}
