from app.core.db import supabase
from app.services.risk_service import evaluate_risk
from app.services.notification_service import send_notification
import logging

logger = logging.getLogger(__name__)

def run_daily_risk_scan():
    """
    Runs every day at 9pm Singapore time.
    Scans all users for risk signals and notifies caregivers if needed.
    """
    logger.info("Running daily risk scan...")

    try:
        result = supabase.table("profiles")\
            .select("id, preferred_name")\
            .eq("onboarding_status", "completed")\
            .execute()

        users = result.data or []
        logger.info(f"Scanning {len(users)} users for risk signals")

        for user in users:
            user_id = user["id"]

            try:
                risk = evaluate_risk(user_id)
                level = risk.get("risk_level", "low")

                # Only notify if medium or high risk
                if level in ("medium", "high"):
                    # Notify the user gently
                    send_notification(
                        user_id=user_id,
                        title="How are you doing?",
                        body="Sushi misses you! Come say hi and check in today.",
                        payload={"type": "engagement_nudge", "risk_level": level}
                    )

                    # Notify caregivers if they have consent
                    contacts = supabase.table("support_contacts")\
                        .select("*")\
                        .eq("senior_user_id", user_id)\
                        .eq("can_receive_alerts", True)\
                        .eq("status", "active")\
                        .execute()

                    for contact in (contacts.data or []):
                        if contact.get("contact_user_id"):
                            send_notification(
                                user_id=contact["contact_user_id"],
                                title="Care alert",
                                body=f"Your loved one may need some attention today.",
                                payload={"type": "caregiver_alert", "risk_level": level}
                            )

            except Exception as e:
                logger.error(f"Risk scan failed for user {user_id}: {e}")

    except Exception as e:
        logger.error(f"Risk worker error: {e}")