from fastapi import APIRouter, HTTPException, Header
from app.schemas.medication import (
    MedicationCreate, MedicationUpdate, MedicationResponse,
    ScheduleCreate, ScheduleResponse,
    MedicationLogUpdate, MedicationLogResponse
)
from app.core.db import supabase
from datetime import datetime, timedelta
import uuid

router = APIRouter(prefix="/medications", tags=["medications"])

def get_user_id(authorization: str) -> str:
    token = authorization.replace("Bearer ", "")
    user = supabase.auth.get_user(token)
    if not user or not user.user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user.user.id

# --- Medications ---

@router.get("/", response_model=list[MedicationResponse])
def get_medications(authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    result = supabase.table("medications").select("*").eq("user_id", user_id).eq("active", True).execute()
    return result.data

@router.post("/", response_model=MedicationResponse)
def create_medication(payload: MedicationCreate, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    data = payload.model_dump(exclude_none=True)
    data["user_id"] = user_id
    # convert date fields to string so Supabase accepts them
    for field in ["start_date", "end_date"]:
        if field in data:
            data[field] = str(data[field])
    result = supabase.table("medications").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create medication")
    return result.data[0]

@router.patch("/{medication_id}", response_model=MedicationResponse)
def update_medication(medication_id: str, payload: MedicationUpdate, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    updates = payload.model_dump(exclude_none=True)
    for field in ["start_date", "end_date"]:
        if field in updates:
            updates[field] = str(updates[field])
    updates["updated_at"] = datetime.utcnow().isoformat()
    result = supabase.table("medications").update(updates).eq("id", medication_id).eq("user_id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Medication not found")
    return result.data[0]

@router.delete("/{medication_id}")
def delete_medication(medication_id: str, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    supabase.table("medications").update({"active": False}).eq("id", medication_id).eq("user_id", user_id).execute()
    return {"message": "Medication deactivated"}

# --- Schedules ---

@router.post("/{medication_id}/schedules", response_model=ScheduleResponse)
def create_schedule(medication_id: str, payload: ScheduleCreate, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    # verify this medication belongs to the user
    med = supabase.table("medications").select("id").eq("id", medication_id).eq("user_id", user_id).single().execute()
    if not med.data:
        raise HTTPException(status_code=404, detail="Medication not found")
    data = payload.model_dump(exclude_none=True)
    data["medication_id"] = medication_id
    for field in ["start_date", "end_date"]:
        if field in data:
            data[field] = str(data[field])
    result = supabase.table("medication_schedules").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create schedule")
    # auto-generate logs for next 7 days
    generate_logs(result.data[0], user_id)
    return result.data[0]

@router.get("/{medication_id}/schedules", response_model=list[ScheduleResponse])
def get_schedules(medication_id: str, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    med = supabase.table("medications").select("id").eq("id", medication_id).eq("user_id", user_id).single().execute()
    if not med.data:
        raise HTTPException(status_code=404, detail="Medication not found")
    result = supabase.table("medication_schedules").select("*").eq("medication_id", medication_id).execute()
    return result.data

# --- Logs ---

@router.get("/logs/today", response_model=list[MedicationLogResponse])
def get_todays_logs(authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0).isoformat()
    today_end = datetime.utcnow().replace(hour=23, minute=59, second=59).isoformat()
    result = supabase.table("medication_logs")\
        .select("*")\
        .eq("user_id", user_id)\
        .gte("due_at", today_start)\
        .lte("due_at", today_end)\
        .execute()
    return result.data

@router.patch("/logs/{log_id}", response_model=MedicationLogResponse)
def update_log(log_id: str, payload: MedicationLogUpdate, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    updates = payload.model_dump(exclude_none=True)
    if payload.status == "taken":
        updates["taken_at"] = datetime.utcnow().isoformat()
    result = supabase.table("medication_logs").update(updates).eq("id", log_id).eq("user_id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Log not found")
    return result.data[0]

# --- Helper: generate logs ---

def generate_logs(schedule: dict, user_id: str):
    """Generate pending log entries for the next 7 days based on a schedule."""
    logs = []
    today = datetime.utcnow().date()
    time_slots = schedule.get("time_slots", ["08:00"])
    days_of_week = schedule.get("days_of_week", [1,2,3,4,5,6,7])

    for day_offset in range(7):
        target_date = today + timedelta(days=day_offset)
        # Monday=1 to match our days_of_week convention
        day_num = target_date.isoweekday()
        if day_num not in days_of_week:
            continue
        for time_slot in time_slots:
            hour, minute = map(int, time_slot.split(":"))
            due_at = datetime(
                target_date.year, target_date.month, target_date.day,
                hour, minute
            )
            logs.append({
                "id": str(uuid.uuid4()),
                "medication_schedule_id": schedule["id"],
                "user_id": user_id,
                "due_at": due_at.isoformat(),
                "status": "pending"
            })

    if logs:
        supabase.table("medication_logs").insert(logs).execute()