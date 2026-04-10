from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from app.core.db import supabase
from app.core.auth import get_current_user_id
from datetime import datetime, timedelta
import uuid
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/caregiver", tags=["caregiver"])

@router.get("/summary")
def get_summary(user_id: str = Depends(get_current_user_id)):
    result = supabase.table("care_summaries")\
        .select("*")\
        .eq("user_id", user_id)\
        .order("created_at", desc=True)\
        .limit(1)\
        .execute()
    return result.data[0] if result.data else {"summary": None, "risk_level": None}

@router.get("/mood-history")
def get_mood_history(user_id: str = Depends(get_current_user_id)):
    """Get mood for last 7 days."""
    now = datetime.utcnow()
    week_ago = (now - timedelta(days=7)).isoformat()

    result = supabase.table("companions")\
        .select("mood_state, updated_at")\
        .eq("user_id", user_id)\
        .execute()

    if not result.data:
        return []

    current_mood = result.data[0]["mood_state"]
    moods = []
    for i in range(7):
        moods.append({"mood": current_mood, "date": (now - timedelta(days=6-i)).date().isoformat()})

    return moods

@router.get("/stats")
def get_stats(user_id: str = Depends(get_current_user_id)):
    """Get weekly stats."""
    from datetime import datetime, timedelta
    now = datetime.utcnow()
    week_ago = (now - timedelta(days=7)).isoformat()

    missions = supabase.table("user_missions")\
        .select("id")\
        .eq("user_id", user_id)\
        .eq("status", "completed")\
        .gte("completed_at", week_ago)\
        .execute()

    meds = supabase.table("medication_logs")\
        .select("id")\
        .eq("user_id", user_id)\
        .eq("status", "taken")\
        .gte("taken_at", week_ago)\
        .execute()

    points = supabase.table("points_ledger")\
        .select("points")\
        .eq("user_id", user_id)\
        .gte("created_at", week_ago)\
        .gt("points", 0)\
        .execute()

    spent = supabase.table("points_ledger")\
        .select("points")\
        .eq("user_id", user_id)\
        .gte("created_at", week_ago)\
        .lt("points", 0)\
        .execute()

    bumps = supabase.table("bump_events")\
        .select("id")\
        .or_(f"user_id_1.eq.{user_id},user_id_2.eq.{user_id}")\
        .gte("bumped_at", week_ago)\
        .execute()

    pet_cares = supabase.table("pet_care_logs")\
        .select("id")\
        .eq("user_id", user_id)\
        .gte("performed_at", week_ago)\
        .execute()

    return {
        "missions_completed": len(missions.data or []),
        "meds_taken": len(meds.data or []),
        "points_earned": sum(p["points"] for p in (points.data or [])),
        "coins_spent": abs(sum(p["points"] for p in (spent.data or []))),
        "bumps_count": len(bumps.data or []),
        "pet_cares": len(pet_cares.data or []),
    }

@router.post("/reports/upload")
async def upload_report(
    report_type: str,
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id)
):
    """Upload a medical report to Supabase Storage."""
    from app.core.config import settings

    file_ext = file.filename.split('.')[-1].lower()
    file_name = f"{user_id}/{report_type}/{uuid.uuid4()}.{file_ext}"

    contents = await file.read()

    # Upload to Supabase Storage
    res = supabase.storage.from_("medical-reports").upload(
        file_name, contents,
        file_options={"content-type": file.content_type}
    )

    # Get public URL
    url = supabase.storage.from_("medical-reports").get_public_url(file_name)

    # Save to DB
    supabase.table("medical_reports").insert({
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "report_type": report_type,
        "file_name": file.filename,
        "file_url": url,
        "file_path": file_name,
        "uploaded_at": datetime.utcnow().isoformat()
    }).execute()

    return {"message": "Uploaded", "url": url}

@router.get("/reports")
def get_reports(user_id: str = Depends(get_current_user_id)):
    result = supabase.table("medical_reports")\
        .select("*")\
        .eq("user_id", user_id)\
        .order("uploaded_at", desc=True)\
        .execute()
    return result.data or []

class ContactCreate(BaseModel):
    name: str
    relationship: Optional[str] = None
    phone: Optional[str] = None
    can_view_summaries: Optional[bool] = True
    can_receive_alerts: Optional[bool] = True

@router.post("/contacts")
def create_contact(payload: ContactCreate, user_id: str = Depends(get_current_user_id)):
    result = supabase.table("support_contacts").insert({
        "user_id": user_id,
        "name": payload.name,
        "relationship": payload.relationship,
        "phone": payload.phone,
        "can_view_summaries": payload.can_view_summaries,
        "can_receive_alerts": payload.can_receive_alerts
    }).execute()
    return result.data[0] if result.data else {}

@router.get("/contacts")
def get_contacts(user_id: str = Depends(get_current_user_id)):
    result = supabase.table("support_contacts")\
        .select("*")\
        .eq("user_id", user_id)\
        .execute()
    return result.data or []