from app.core.db import supabase
from app.services.mission_service import assign_daily_missions
from app.services.notification_service import send_notification
from datetime import date
import logging

logger = logging.getLogger(__name__)

def assign_daily_missions_all_users():
    """
    Runs every day at 7am Singapore time.
    Assigns daily missions to all active users and sends a morning nudge.
    """
    logger.info("Assigning daily missions to all users...")

    try:
        # Get all profiles
        result = supabase.table("profiles")\
            .select("id, preferred_name")\
            .eq("onboarding_status", "completed")\
            .execute()

        users = result.data or []
        logger.info(f"Assigning missions to {len(users)} users")

        for user in users:
            user_id = user["id"]
            name = user.get("preferred_name") or "there"

            try:
                missions = assign_daily_missions(user_id, date.today())

                if missions:
                    send_notification(
                        user_id=user_id,
                        title="Good morning!",
                        body=f"Hi {name}! You have {len(missions)} missions today. Sushi is waiting for you!",
                        payload={"type": "daily_missions", "count": len(missions)}
                    )
            except Exception as e:
                logger.error(f"Failed to assign missions for user {user_id}: {e}")

    except Exception as e:
        logger.error(f"Mission worker error: {e}")