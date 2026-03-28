from fastapi import Header, HTTPException
from app.core.db import supabase

def get_current_user_id(authorization: str = Header(...)) -> str:
    """Shared FastAPI dependency for extracting and validating the user ID from JWT."""
    token = authorization.replace("Bearer ", "")
    try:
        user = supabase.auth.get_user(token)
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        return user.user.id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")