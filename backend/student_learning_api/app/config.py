# app/config.py
from pydantic_settings import BaseSettings
from pydantic import Field
import os
from typing import Optional

class Settings(BaseSettings):
    """Application settings with environment variable support"""
    # MongoDB settings
    MONGO_URI: str = Field(..., env="MONGO_URI")
    DATABASE_NAME: str = Field("student_learning", env="DATABASE_NAME")
    MONGO_MAX_POOL_SIZE: int = Field(100, env="MONGO_MAX_POOL_SIZE")
    MONGO_MIN_POOL_SIZE: int = Field(10, env="MONGO_MIN_POOL_SIZE")
    MONGO_MAX_IDLE_TIME_MS: int = Field(10000, env="MONGO_MAX_IDLE_TIME_MS")
    MONGO_WAIT_QUEUE_TIMEOUT_MS: int = Field(1000, env="MONGO_WAIT_QUEUE_TIMEOUT_MS")
    
    # Redis settings
    REDIS_URL: str = Field("redis://localhost:6379/0", env="REDIS_URL")
    REDIS_MAX_CONNECTIONS: int = Field(50, env="REDIS_MAX_CONNECTIONS")
    
    # API settings
    API_V1_PREFIX: str = Field("/api/v1", env="API_V1_PREFIX")
    DEBUG: bool = Field(False, env="DEBUG")
    RATE_LIMIT_PER_MINUTE: int = Field(60, env="RATE_LIMIT_PER_MINUTE")
    
    # Security settings
    SECRET_KEY: str = Field(..., env="SECRET_KEY")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    
    # Logging
    LOG_LEVEL: str = Field("INFO", env="LOG_LEVEL")
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Load settings
settings = Settings()

# Configure logging
import logging
import sys

logging_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
logging.basicConfig(
    level=logging_level,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
if __name__ == "__main__":
    print("Mongo URI:", settings.MONGO_URI)
    print("Redis URL:", settings.REDIS_URL)
    print("Secret Key:", settings.SECRET_KEY)
    print("Log level:", settings.LOG_LEVEL)
