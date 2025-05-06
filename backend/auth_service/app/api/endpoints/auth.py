from fastapi import APIRouter, Depends, HTTPException, Request, Body
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.oauth import oauth, get_google_user_info
from app.core.security import create_access_token
from app.schemas.user import Token, UserResponse
from app.models.user import User
from app.api.dependencies import get_current_active_user, get_current_user
from datetime import datetime
import uuid

router = APIRouter()

@router.post("/mock-login", response_model=Token)
async def mock_login(
    email: str = Body(..., example="test@example.com"),
    name: str = Body(..., example="Test User"),
    db: Session = Depends(get_db)
):
    """
    Mock login endpoint for testing without Google OAuth
    
    This endpoint simulates the OAuth flow by:
    1. Creating a test user if they don't exist
    2. Generating a valid JWT token
    
    In production, this endpoint should be disabled
    """
    # Check if user exists or create new user
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            name=name,
            google_id=f"mock_{uuid.uuid4()}",
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Create access token
    access_token = create_access_token(data={"sub": str(user.id)})
    return Token(access_token=access_token, token_type="bearer")

@router.get("/login/google")
async def google_login(request: Request):
    """Initiate Google OAuth login"""
    redirect_uri = request.url_for('google_callback')
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/callback/google")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    """Handle Google OAuth callback"""
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = await get_google_user_info(token)
        
        # Check if user exists or create new user
        user = db.query(User).filter(User.email == user_info["email"]).first()
        if not user:
            user = User(
                email=user_info["email"],
                name=user_info["name"],
                google_id=user_info["google_id"],
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.commit()
        
        # Create access token
        access_token = create_access_token(data={"sub": str(user.id)})
        return Token(access_token=access_token, token_type="bearer")
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    """Get current user information"""
    return current_user