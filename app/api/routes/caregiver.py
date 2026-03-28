from fastapi import APIRouter, HTTPException, Header
from app.schemas.caregiver import (
    SupportContactCreate, SupportContactResponse,
    BehaviorSignalResponse, RiskFlagResponse, CareSummaryResponse
)
from app.services.risk_service import evaluate_risk, generate_weekly_summary
from app.core.db import supabase
from datetime import date, timedelta, datetime

router = APIRouter(prefix="/caregiver", tags=["caregiver"])

def get_user_id(authorization: str) -> str:
    token = authorization.replace("Bearer ", "")
    user = supabase.auth.get_user(token)
    if not user or not user.user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user.user.id

# --- Support contacts ---

@router.post("/contacts", response_model=SupportContactResponse)
def add_support_contact(payload: SupportContactCreate, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    data = payload.model_dump()
    data["senior_user_id"] = user_id
    result = supabase.table("support_contacts").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to add contact")
    return result.data[0]

@router.get("/contacts", response_model=list[SupportContactResponse])
def get_support_contacts(authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    result = supabase.table("support_contacts")\
        .select("*")\
        .eq("senior_user_id", user_id)\
        .execute()
    return result.data

@router.delete("/contacts/{contact_id}")
def remove_support_contact(contact_id: str, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    supabase.table("support_contacts")\
        .update({"status": "revoked"})\
        .eq("id", contact_id)\
        .eq("senior_user_id", user_id)\
        .execute()
    return {"message": "Contact revoked"}

# --- Risk and signals ---

@router.post("/scan")
def run_risk_scan(authorization: str = Header(...)):
    """Manually trigger a risk scan for the current user."""
    user_id = get_user_id(authorization)
    result = evaluate_risk(user_id)
    return result

@router.get("/signals", response_model=list[BehaviorSignalResponse])
def get_signals(authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    result = supabase.table("behavior_signals")\
        .select("*")\
        .eq("user_id", user_id)\
        .order("detected_at", desc=True)\
        .limit(20)\
        .execute()
    return result.data

@router.get("/flags", response_model=list[RiskFlagResponse])
def get_risk_flags(authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    result = supabase.table("risk_flags")\
        .select("*")\
        .eq("user_id", user_id)\
        .order("created_at", desc=True)\
        .execute()
    return result.data

@router.patch("/flags/{flag_id}/acknowledge")
def acknowledge_flag(flag_id: str, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    supabase.table("risk_flags")\
        .update({"status": "acknowledged"})\
        .eq("id", flag_id)\
        .eq("user_id", user_id)\
        .execute()
    return {"message": "Flag acknowledged"}

# --- Summaries ---

@router.post("/summary/generate", response_model=CareSummaryResponse)
def generate_summary(authorization: str = Header(...)):
    """Generate a weekly summary using SEA-LION."""
    user_id = get_user_id(authorization)

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
def get_summaries(authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    result = supabase.table("care_summaries")\
        .select("*")\
        .eq("user_id", user_id)\
        .order("generated_at", desc=True)\
        .execute()
    return result.data