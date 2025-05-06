from typing import Optional, Dict, Any
from authlib.integrations.starlette_client import OAuth
from fastapi import HTTPException
from app.core.config import settings
from app.models.user import User
from sqlalchemy.orm import Session

oauth = OAuth()
oauth.register(
    name='google',
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    client_kwargs={
        'scope': 'openid email profile'
    }
)

async def get_google_user_info(token: Dict[str, Any]) -> Dict[str, Any]:
    """Get user info from Google using OAuth token"""
    try:
        resp = await oauth.google.parse_id_token(token, None)
        return {
            'email': resp.get('email'),
            'name': resp.get('name'),
            'google_id': resp.get('sub'),
            'picture': resp.get('picture')
        }
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to fetch user info from Google: {str(e)}"
        )

class OAuthService:
    @staticmethod
    async def authenticate_google(access_token: str, db: Session) -> Optional[User]:
        try:
            resp = await oauth.google.get('https://www.googleapis.com/oauth2/v3/userinfo')
            profile = resp.json()
            
            user = db.query(User).filter(User.email == profile["email"]).first()
            if not user:
                user = User(
                    email=profile["email"],
                    google_id=profile["sub"],
                    full_name=profile["name"],
                    is_active=True
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            return user
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @staticmethod
    def get_google_oauth_url():
        return oauth.google.authorize_redirect_url()
