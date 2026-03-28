from fastapi import APIRouter, Depends
from app.core.auth import get_current_user_id
from app.services.notification_service import (
    get_unread_notifications,
    mark_notification_read,
    mark_all_read
)
from app.core.db import supabase
from app.workers.medication_worker import check_upcoming_medications


router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("/")
def get_notifications(user_id: str = Depends(get_current_user_id)):
    return get_unread_notifications(user_id)

@router.get("/all")
def get_all_notifications(user_id: str = Depends(get_current_user_id)):
    result = supabase.table("notifications")\
        .select("*")\
        .eq("user_id", user_id)\
        .order("sent_at", desc=True)\
        .limit(50)\
        .execute()
    return result.data

@router.patch("/{notification_id}/read")
def read_notification(notification_id: str, user_id: str = Depends(get_current_user_id)):
    mark_notification_read(notification_id, user_id)
    return {"message": "Marked as read"}

@router.patch("/read-all")
def read_all(user_id: str = Depends(get_current_user_id)):
    mark_all_read(user_id)
    return {"message": "All notifications marked as read"}

@router.post("/test-medication-worker")
def test_medication_worker():
    check_upcoming_medications()
    return {"message": "Worker ran — check your notifications"}