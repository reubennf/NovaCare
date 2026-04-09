from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import pytz
import logging
from app.core.db import supabase

logger = logging.getLogger(__name__)
scheduler = BackgroundScheduler(timezone=pytz.timezone("Asia/Singapore"))

def update_all_moods_hourly():
    """Update mood for all users every hour."""
    from app.services.risk_service import update_companion_mood_from_care
    users = supabase.table("profiles")\
        .select("id")\
        .eq("onboarding_status", "completed")\
        .execute()
    for user in (users.data or []):
        try:
            update_companion_mood_from_care(user["id"])
        except Exception as e:
            print(f"Mood update failed for {user['id']}: {e}")

def start_scheduler():
    """Register all jobs and start the scheduler."""
    from app.workers.medication_worker import check_upcoming_medications
    from app.workers.mission_worker import assign_daily_missions_all_users
    from app.workers.risk_worker import run_daily_risk_scan

    # Check medications every 15 minutes
    scheduler.add_job(
        check_upcoming_medications,
        trigger="interval",
        minutes=15,
        id="medication_check",
        replace_existing=True
    )

    # Assign daily missions at 7am Singapore time
    scheduler.add_job(
        assign_daily_missions_all_users,
        trigger=CronTrigger(hour=7, minute=0, timezone=pytz.timezone("Asia/Singapore")),
        id="daily_missions",
        replace_existing=True
    )

    # Run risk scan at 9pm Singapore time
    scheduler.add_job(
        run_daily_risk_scan,
        trigger=CronTrigger(hour=21, minute=0, timezone=pytz.timezone("Asia/Singapore")),
        id="daily_risk_scan",
        replace_existing=True
    )

    # Update companion moods every hour
    scheduler.add_job(
        update_all_moods_hourly,
        trigger="interval",
        hours=1,
        id="mood_worker",
        replace_existing=True
    )

    scheduler.start()
    logger.info("Scheduler started with all jobs registered")

def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler stopped")