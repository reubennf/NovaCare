from fastapi import APIRouter, HTTPException, Depends
from app.schemas.onboarding import OnboardingPayload
from app.core.db import supabase
from app.core.auth import get_current_user_id
from datetime import datetime

router = APIRouter(prefix="/onboarding", tags=["onboarding"])

@router.post("/complete")
def complete_onboarding(payload: OnboardingPayload, user_id: str = Depends(get_current_user_id)):
    try:
        # Update profile
        supabase.table("profiles").update({
            "healthhub_sync": payload.healthhub_sync,
            "assigned_doctor": payload.assigned_doctor,
            "takes_daily_medication": payload.takes_daily_medication,
            "has_support_person": payload.has_support_person,
            "onboarding_status": "completed",
            "onboarding_completed_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", user_id).execute()

        # Update accessibility preferences
        supabase.table("accessibility_preferences").update({
            "text_size": payload.text_size,
            "voice_mode_enabled": payload.voice_mode_enabled,
            "high_contrast_enabled": payload.high_contrast_enabled,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("user_id", user_id).execute()

        # Clear old health conditions and insert new ones
        supabase.table("user_health_conditions")\
            .delete()\
            .eq("user_id", user_id)\
            .execute()

        if payload.health_conditions:
            conditions = [
                {"user_id": user_id, "condition": c}
                for c in payload.health_conditions
            ]
            supabase.table("user_health_conditions").insert(conditions).execute()

        return {"message": "Onboarding complete"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
def get_onboarding_status(user_id: str = Depends(get_current_user_id)):
    result = supabase.table("profiles")\
        .select("onboarding_status")\
        .eq("id", user_id)\
        .execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {"onboarding_status": result.data[0]["onboarding_status"]}