from app.core.db import supabase
from app.services.notification_service import send_notification
from datetime import datetime, timedelta
import pytz
import logging

logger = logging.getLogger(__name__)

def check_upcoming_medications():
    """
    Runs every 15 minutes.
    Finds medication doses due in the next 30 minutes and sends reminders.
    """
    logger.info("Running medication reminder check...")
    sg_tz = pytz.timezone("Asia/Singapore")
    now = datetime.now(sg_tz)
    window_start = now.isoformat()
    window_end = (now + timedelta(minutes=30)).isoformat()

    try:
        # Get all pending logs due in the next 30 minutes
        result = supabase.table("medication_logs")\
            .select("*, medication_schedules(medication_id)")\
            .eq("status", "pending")\
            .gte("due_at", window_start)\
            .lte("due_at", window_end)\
            .execute()

        logs = result.data or []
        logger.info(f"Found {len(logs)} upcoming medication doses")

        for log in logs:
            user_id = log["user_id"]
            due_at = log["due_at"]

            # Get medication name
            schedule = log.get("medication_schedules", {})
            med_id = schedule.get("medication_id") if schedule else None
            med_name = "your medication"

            if med_id:
                med_result = supabase.table("medications")\
                    .select("name")\
                    .eq("id", med_id)\
                    .execute()
                if med_result.data:
                    med_name = med_result.data[0]["name"]

            # Parse due time for display
            try:
                due_time = datetime.fromisoformat(due_at.replace("Z", "+00:00"))
                due_time_sg = due_time.astimezone(sg_tz)
                time_str = due_time_sg.strftime("%I:%M %p")
            except Exception:
                time_str = "soon"

            send_notification(
                user_id=user_id,
                title="Medication reminder",
                body=f"Time to take {med_name} at {time_str}",
                payload={"log_id": log["id"], "type": "medication"}
            )

    except Exception as e:
        logger.error(f"Medication worker error: {e}")