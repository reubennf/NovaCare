from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import pytz
import logging

logger = logging.getLogger(__name__)
scheduler = BackgroundScheduler(timezone=pytz.timezone("Asia/Singapore"))

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

    scheduler.start()
    logger.info("Scheduler started with all jobs registered")

def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler stopped")