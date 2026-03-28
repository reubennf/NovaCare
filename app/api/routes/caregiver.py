from fastapi import APIRouter, HTTPException, Depends
from app.schemas.caregiver import (
    SupportContactCreate, SupportContactResponse,
    BehaviorSignalResponse, RiskFlagResponse, CareSummaryResponse
)
from app.services.risk_service import evaluate_risk, generate_weekly_summary
from app.core.db import supabase
from datetime import date, timedelta, datetime
from app.core.auth import get_current_user_id


router = APIRouter(prefix="/caregiver", tags=["caregiver"])

# --- Support contacts ---

@router.post("/contacts", response_model=SupportContactResponse)
def add_support_contact(payload: SupportContactCreate, user_id: str = Depends(get_current_user_id)):
    data = payload.model_dump()
    data["senior_user_id"] = user_id
    result = supabase.table("support_contacts").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to add contact")
    return result.data[0]

@router.get("/contacts", response_model=list[SupportContactResponse])
def get_support_contacts(user_id: str = Depends(get_current_user_id)):
    result = supabase.table("support_contacts")\
        .select("*")\
        .eq("senior_user_id", user_id)\
        .execute()
    return result.data

@router.delete("/contacts/{contact_id}")
def remove_support_contact(contact_id: str, user_id: str = Depends(get_current_user_id)):
    supabase.table("support_contacts")\
        .update({"status": "revoked"})\
        .eq("id", contact_id)\
        .eq("senior_user_id", user_id)\
        .execute()
    return {"message": "Contact revoked"}

# --- Risk and signals ---

@router.post("/scan")
def run_risk_scan(user_id: str = Depends(get_current_user_id)):
    """Manually trigger a risk scan for the current user."""
    result = evaluate_risk(user_id)
    return result

@router.get("/signals", response_model=list[BehaviorSignalResponse])
def get_signals(user_id: str = Depends(get_current_user_id)):
    result = supabase.table("behavior_signals")\
        .select("*")\
        .eq("user_id", user_id)\
        .order("detected_at", desc=True)\
        .limit(20)\
        .execute()
    return result.data

@router.get("/flags", response_model=list[RiskFlagResponse])
def get_risk_flags(user_id: str = Depends(get_current_user_id)):
    result = supabase.table("risk_flags")\
        .select("*")\
        .eq("user_id", user_id)\
        .order("created_at", desc=True)\
        .execute()
    return result.data

@router.patch("/flags/{flag_id}/acknowledge")
def acknowledge_flag(flag_id: str, user_id: str = Depends(get_current_user_id)):
    supabase.table("risk_flags")\
        .update({"status": "acknowledged"})\
        .eq("id", flag_id)\
        .eq("user_id", user_id)\
        .execute()
    return {"message": "Flag acknowledged"}

# --- Summaries ---

@router.post("/summary/generate", response_model=CareSummaryResponse)
def generate_summary(user_id: str = Depends(get_current_user_id)):
    """Generate a weekly summary using SEA-LION."""

    summary_text = generate_weekly_summary(user_id)
    today = date.today()
    week_ago = today - timedelta(days=7)

    # Run a risk scan to get current risk level
    risk_result = evaluate_risk(user_id)
    risk_level = risk_result.get("risk_level", "low")

    result = supabase.table("care_summaries").insert({
        "user_id": user_id,
        "period_start": str(week_ago),
        "period_end": str(today),
        "summary_type": "weekly",
        "summary_text": summary_text,
        "risk_level": risk_level,
        "approved_at": datetime.utcnow().isoformat()
    }).execute()

    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to generate summary")
    return result.data[0]

@router.get("/summaries", response_model=list[CareSummaryResponse])
def get_summaries(user_id: str = Depends(get_current_user_id)):
    result = supabase.table("care_summaries")\
        .select("*")\
        .eq("user_id", user_id)\
        .order("generated_at", desc=True)\
        .execute()
    return result.data