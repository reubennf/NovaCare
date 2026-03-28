from fastapi import APIRouter, HTTPException, Header
from app.schemas.profile import ProfileUpdate, ProfileResponse, AccessibilityPrefsUpdate, AccessibilityPrefsResponse
from app.core.db import supabase

router = APIRouter(prefix="/profiles", tags=["profiles"])

def get_user_id(authorization: str) -> str:
    """Extract user ID from Supabase JWT token."""
    token = authorization.replace("Bearer ", "")
    user = supabase.auth.get_user(token)
    if not user or not user.user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user.user.id

@router.get("/me", response_model=ProfileResponse)
def get_my_profile(authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    result = supabase.table("profiles").select("*").eq("id", user_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return result.data

@router.patch("/me", response_model=ProfileResponse)
def update_my_profile(payload: ProfileUpdate, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    updates = payload.model_dump(exclude_none=True)
    updates["updated_at"] = "now()"
    result = supabase.table("profiles").update(updates).eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Update failed")
    return result.data[0]

@router.get("/me/accessibility", response_model=AccessibilityPrefsResponse)
def get_accessibility_prefs(authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    result = supabase.table("accessibility_preferences").select("*").eq("user_id", user_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Preferences not found")
    return result.data

@router.patch("/me/accessibility", response_model=AccessibilityPrefsResponse)
def update_accessibility_prefs(payload: AccessibilityPrefsUpdate, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    updates = payload.model_dump(exclude_none=True)
    updates["updated_at"] = "now()"
    result = supabase.table("accessibility_preferences").update(updates).eq("user_id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Update failed")
    return result.data[0]