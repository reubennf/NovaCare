from app.core.db import supabase
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

def send_notification(user_id: str, title: str, body: str, job_id: str = None, payload: dict = None):
    """Save an in-app notification to the database."""
    try:
        supabase.table("notifications").insert({
            "user_id": user_id,
            "job_id": job_id,
            "channel": "in_app",
            "title": title,
            "body": body,
            "payload": payload or {},
            "sent_at": datetime.utcnow().isoformat()
        }).execute()
        logger.info(f"Notification sent to {user_id}: {title}")
    except Exception as e:
        logger.error(f"Failed to send notification to {user_id}: {e}")

def get_unread_notifications(user_id: str) -> list:
    """Fetch unread notifications for a user."""
    result = supabase.table("notifications")\
        .select("*")\
        .eq("user_id", user_id)\
        .is_("read_at", "null")\
        .order("sent_at", desc=True)\
        .limit(20)\
        .execute()
    return result.data or []

def mark_notification_read(notification_id: str, user_id: str):
    """Mark a notification as read."""
    supabase.table("notifications")\
        .update({"read_at": datetime.utcnow().isoformat()})\
        .eq("id", notification_id)\
        .eq("user_id", user_id)\
        .execute()

def mark_all_read(user_id: str):
    """Mark all notifications as read for a user."""
    supabase.table("notifications")\
        .update({"read_at": datetime.utcnow().isoformat()})\
        .eq("user_id", user_id)\
        .is_("read_at", "null")\
        .execute()