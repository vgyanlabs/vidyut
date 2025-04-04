import os
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, Body
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from pydantic import BaseModel

from mongodb_manager import MongoDBManager

# Security models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class User(BaseModel):
    username: str
    email: Optional[str] = None
    role: str = "user"

class UserInDB(User):
    hashed_password: str

# Security settings
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-for-development-only")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Security utilities
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Router
router = APIRouter()
mongodb_manager = MongoDBManager()

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_user(username: str):
    user = await mongodb_manager.get_user(username)
    if user:
        return UserInDB(**user)
    return None

async def authenticate_user(username: str, password: str):
    user = await get_user(username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = await get_user(username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: UserInDB = Depends(get_current_user)):
    return current_user

# Routes
@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    # Log login event
    await mongodb_manager.log_audit_event(
        user_id=user.username,
        action="login",
        details={"ip": "127.0.0.1"}  # In a real app, get the actual IP
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/users/", response_model=User)
async def create_user(
    username: str = Body(...),
    email: str = Body(...),
    password: str = Body(...),
    role: str = Body("user")
):
    # Check if user already exists
    existing_user = await mongodb_manager.get_user(username)
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Hash password and create user
    hashed_password = get_password_hash(password)
    user_id = await mongodb_manager.create_user(
        username=username,
        email=email,
        hashed_password=hashed_password,
        role=role
    )
    
    if not user_id:
        raise HTTPException(status_code=500, detail="Failed to create user")
    
    return {"username": username, "email": email, "role": role}

@router.get("/users/me/", response_model=User)
async def read_users_me(current_user: UserInDB = Depends(get_current_active_user)):
    return current_user

@router.get("/audit-logs/")
async def get_audit_logs(
    current_user: UserInDB = Depends(get_current_active_user),
    limit: int = 100,
    skip: int = 0
):
    # Only allow admins to view all logs
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to view audit logs")
    
    logs = await mongodb_manager.get_audit_logs({}, limit, skip)
    return logs

@router.get("/audit-logs/me/")
async def get_my_audit_logs(
    current_user: UserInDB = Depends(get_current_active_user),
    limit: int = 100,
    skip: int = 0
):
    logs = await mongodb_manager.get_audit_logs({"user_id": current_user.username}, limit, skip)
    return logs
