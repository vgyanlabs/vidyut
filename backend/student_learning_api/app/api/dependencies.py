# app/api/dependencies.py
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from app.db.mongo_connection import mongodb
from app.config import settings
from typing import Optional
import redis.asyncio as redis
import logging
from datetime import datetime, timedelta

# Setup logging
logger = logging.getLogger("dependencies")

# Redis connection
redis_pool = None

async def get_redis():
    """Get Redis connection from pool"""
    global redis_pool
    if redis_pool is None:
        redis_pool = redis.ConnectionPool.from_url(
            settings.REDIS_URL,
            max_connections=settings.REDIS_MAX_CONNECTIONS,
            decode_responses=True
        )
        logger.info("Redis connection pool initialized")

    try:
        redis_client = redis.Redis(connection_pool=redis_pool)
        await redis_client.ping()
        yield redis_client
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        logger.error(f"Redis connection error: {str(e)}")
        raise HTTPException(status_code=500, detail="Cache service unavailable")


async def get_db():
    """Get MongoDB database connection"""
    try:
        if mongodb.db is None:
            await mongodb.connect()
        yield mongodb.db
    except HTTPException as http_exc:
        # Pass through HTTP exceptions as-is
        raise http_exc
    except Exception as e:
        logger.error(f"Database connection error: {str(e)}")
        raise HTTPException(status_code=500, detail="Database connection error")


# Rate limiting middleware
async def rate_limit(request: Request, redis_client: redis.Redis = Depends(get_redis)):
    """Rate limiting using the sliding window algorithm"""
    # REMEMBER: Rate limiting is crucial for API stability
    
    # Get client IP
    client_ip = request.client.host
    
    # Create a key that includes the endpoint
    endpoint = request.url.path
    rate_key = f"ratelimit:{client_ip}:{endpoint}"
    
    # Current timestamp
    now = datetime.utcnow().timestamp()
    window_size = 60  # 1 minute window
    
    # Add the current request timestamp to the sorted set
    await redis_client.zadd(rate_key, {str(now): now})
    
    # Remove timestamps outside the window
    await redis_client.zremrangebyscore(rate_key, 0, now - window_size)
    
    # Count requests in the current window
    request_count = await redis_client.zcard(rate_key)
    
    # Set expiry on the key
    await redis_client.expire(rate_key, window_size)
    
    # Check if rate limit exceeded
    if request_count > settings.RATE_LIMIT_PER_MINUTE:
        logger.warning(f"Rate limit exceeded for {client_ip} on {endpoint}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please try again later."
        )

# Caching dependency
class CacheManager:
    """Advanced caching manager for API responses"""
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
    
    async def get_cached_data(self, key: str) -> Optional[str]:
        """Get data from cache"""
        return await self.redis.get(key)
    
    async def set_cached_data(self, key: str, value: str, expire_seconds: int = 300):
        """Set data in cache with expiration"""
        await self.redis.set(key, value, ex=expire_seconds)
    
    async def invalidate_cache(self, pattern: str):
        """Invalidate cache entries matching pattern"""
        keys = await self.redis.keys(pattern)
        if keys:
            await self.redis.delete(*keys)

async def get_cache_manager(redis_client: redis.Redis = Depends(get_redis)):
    """Dependency for cache manager"""
    return CacheManager(redis_client)