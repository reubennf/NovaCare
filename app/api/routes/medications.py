from fastapi import APIRouter, HTTPException, Depends
from app.schemas.medication import (
    MedicationCreate, MedicationUpdate, MedicationResponse,
    ScheduleCreate, ScheduleResponse,
    MedicationLogUpdate, MedicationLogResponse
)
from app.core.db import supabase
from app.core.auth import get_current_user_id
from datetime import datetime, timedelta
import uuid

router = APIRouter(prefix="/medications", tags=["medications"])

@router.get("/", response_model=list[MedicationResponse])
def get_medications(user_id: str = Depends(get_current_user_id)):
    result = supabase.table("medications").select("*").eq("user_id", user_id).eq("active", True).execute()
    return result.data

@router.post("/", response_model=MedicationResponse)
def create_medication(payload: MedicationCreate, user_id: str = Depends(get_current_user_id)):
    data = payload.model_dump(exclude_none=True)
    data["user_id"] = user_id
    for field in ["start_date", "end_date"]:
        if field in data:
            data[field] = str(data[field])
    result = supabase.table("medications").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create medication")
    return result.data[0]

@router.patch("/{medication_id}", response_model=MedicationResponse)
def update_medication(medication_id: str, payload: MedicationUpdate, user_id: str = Depends(get_current_user_id)):
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
def delete_medication(medication_id: str, user_id: str = Depends(get_current_user_id)):
    supabase.table("medications").update({"active": False}).eq("id", medication_id).eq("user_id", user_id).execute()
    return {"message": "Medication deactivated"}

@router.post("/{medication_id}/schedules", response_model=ScheduleResponse)
def create_schedule(medication_id: str, payload: ScheduleCreate, user_id: str = Depends(get_current_user_id)):
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
    generate_logs(result.data[0], user_id)
    return result.data[0]

@router.get("/{medication_id}/schedules", response_model=list[ScheduleResponse])
def get_schedules(medication_id: str, user_id: str = Depends(get_current_user_id)):
    med = supabase.table("medications").select("id").eq("id", medication_id).eq("user_id", user_id).single().execute()
    if not med.data:
        raise HTTPException(status_code=404, detail="Medication not found")
    result = supabase.table("medication_schedules").select("*").eq("medication_id", medication_id).execute()
    return result.data

@router.get("/logs/today", response_model=list[MedicationLogResponse])
def get_today_logs(user_id: str = Depends(get_current_user_id)):
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0).isoformat()
    today_end = datetime.utcnow().replace(hour=23, minute=59, second=59).isoformat()
    result = supabase.table("medication_logs")\
        .select("*")\
        .eq("user_id", user_id)\
        .gte("due_at", today_start)\
        .lte("due_at", today_end)\
        .order("due_at")\
        .execute()
    return result.data or []

@router.patch("/logs/{log_id}", response_model=MedicationLogResponse)
def update_log(log_id: str, payload: MedicationLogUpdate, user_id: str = Depends(get_current_user_id)):
    from datetime import datetime
    updates = {"status": payload.get("status")}
    if payload.get("status") == "taken":
        updates["taken_at"] = datetime.utcnow().isoformat()

    supabase.table("medication_logs")\
        .update(updates)\
        .eq("id", log_id)\
        .eq("user_id", user_id)\
        .execute()

    return {"message": "Updated"}

def generate_logs(schedule: dict, user_id: str):
    logs = []
    today = datetime.utcnow().date()
    time_slots = schedule.get("time_slots", ["08:00"])
    days_of_week = schedule.get("days_of_week", [1,2,3,4,5,6,7])
    for day_offset in range(7):
        target_date = today + timedelta(days=day_offset)
        day_num = target_date.isoweekday()
        if day_num not in days_of_week:
            continue
        for time_slot in time_slots:
            hour, minute = map(int, time_slot.split(":"))
            due_at = datetime(target_date.year, target_date.month, target_date.day, hour, minute)
            logs.append({
                "id": str(uuid.uuid4()),
                "medication_schedule_id": schedule["id"],
                "user_id": user_id,
                "due_at": due_at.isoformat(),
                "status": "pending"
            })
    if logs:
        supabase.table("medication_logs").insert(logs).execute()


@router.delete("/{medication_id}")
def delete_medication(medication_id: str, user_id: str = Depends(get_current_user_id)):
    """Delete a medication and all its logs."""
    # Verify ownership first
    med = supabase.table("medications")\
        .select("id")\
        .eq("id", medication_id)\
        .eq("user_id", user_id)\
        .execute()
    
    if not med.data:
        raise HTTPException(status_code=404, detail="Medication not found")

    # Delete logs first (foreign key)
    supabase.table("medication_logs")\
        .delete()\
        .eq("medication_id", medication_id)\
        .execute()

    # Delete schedules
    supabase.table("medication_schedules")\
        .delete()\
        .eq("medication_id", medication_id)\
        .execute()

    # Delete medication
    supabase.table("medications")\
        .delete()\
        .eq("id", medication_id)\
        .execute()

    return {"message": "Deleted"}