from fastapi import APIRouter, HTTPException, Depends
from app.schemas.profile import ProfileUpdate, ProfileResponse, AccessibilityPrefsUpdate, AccessibilityPrefsResponse
from app.core.db import supabase
from app.core.auth import get_current_user_id

router = APIRouter(prefix="/profiles", tags=["profiles"])

@router.get("/me", response_model=ProfileResponse)
def get_my_profile(user_id: str = Depends(get_current_user_id)):
    result = supabase.table("profiles").select("*").eq("id", user_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return result.data

@router.patch("/me", response_model=ProfileResponse)
def update_my_profile(payload: ProfileUpdate, user_id: str = Depends(get_current_user_id)):
    updates = payload.model_dump(exclude_none=True)
    updates["updated_at"] = "now()"
    result = supabase.table("profiles").update(updates).eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Update failed")
    return result.data[0]

@router.get("/me/accessibility", response_model=AccessibilityPrefsResponse)
def get_accessibility_prefs(user_id: str = Depends(get_current_user_id)):
    result = supabase.table("accessibility_preferences").select("*").eq("user_id", user_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Preferences not found")
    return result.data

@router.patch("/me/accessibility", response_model=AccessibilityPrefsResponse)
def update_accessibility_prefs(payload: AccessibilityPrefsUpdate, user_id: str = Depends(get_current_user_id)):
    updates = payload.model_dump(exclude_none=True)
    updates["updated_at"] = "now()"
    result = supabase.table("accessibility_preferences").update(updates).eq("user_id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Update failed")
    return result.data[0]