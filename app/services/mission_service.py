from app.core.db import supabase
from datetime import date, datetime
import random

def get_user_points(user_id: str) -> int:
    """Calculate total points from ledger."""
    result = supabase.table("points_ledger")\
        .select("points_delta")\
        .eq("user_id", user_id)\
        .execute()
    return sum(row["points_delta"] for row in (result.data or []))

def award_points(user_id: str, points: int, source_type: str, source_id: str = None, note: str = None):
    """Add a points entry to the ledger."""
    supabase.table("points_ledger").insert({
        "user_id": user_id,
        "points_delta": points,
        "source_type": source_type,
        "source_id": source_id,
        "note": note
    }).execute()

def assign_daily_missions(user_id: str, target_date: date = None) -> list:
    """Assign missions for a given day if not already assigned."""
    if not target_date:
        target_date = date.today()

    # Check if missions already assigned for today
    existing = supabase.table("user_missions")\
        .select("id")\
        .eq("user_id", user_id)\
        .eq("scheduled_for", str(target_date))\
        .execute()

    if existing.data:
        return existing.data

    # Get all active templates
    templates = supabase.table("mission_templates")\
        .select("*")\
        .eq("active", True)\
        .execute()

    if not templates.data:
        return []

    # Pick 3 random missions for the day
    selected = random.sample(templates.data, min(3, len(templates.data)))

    missions = []
    for template in selected:
        mission = {
            "user_id": user_id,
            "mission_template_id": template["id"],
            "scheduled_for": str(target_date),
            "status": "assigned",
            "target_value": 1,
            "generated_reason": f"Daily {template['category']} mission"
        }
        missions.append(mission)

    result = supabase.table("user_missions").insert(missions).execute()
    return result.data or []

def complete_mission(mission_id: str, user_id: str) -> dict:
    """Mark a mission as complete and award points."""
    # Get mission with template
    mission = supabase.table("user_missions")\
        .select("*, mission_templates(*)")\
        .eq("id", mission_id)\
        .eq("user_id", user_id)\
        .single()\
        .execute()

    if not mission.data:
        return {"error": "Mission not found"}

    if mission.data["status"] == "completed":
        return {"error": "Mission already completed"}

    # Mark as complete
    supabase.table("user_missions").update({
        "status": "completed",
        "progress_value": 1,
        "completed_at": datetime.utcnow().isoformat()
    }).eq("id", mission_id).execute()

    # Award points
    template = mission.data.get("mission_templates", {})
    points = template.get("base_points", 10)
    award_points(
        user_id=user_id,
        points=points,
        source_type="mission",
        source_id=mission_id,
        note=f"Completed: {template.get('title', 'mission')}"
    )

    # Update streak
    update_streak(user_id)

    # Level up pet if enough XP
    update_pet_xp(user_id, points)

    return {"points_awarded": points, "mission_id": mission_id}

def update_streak(user_id: str):
    """Update the user's daily streak."""
    today = date.today()
    streak = supabase.table("daily_streaks")\
        .select("*")\
        .eq("user_id", user_id)\
        .execute()

    if not streak.data:
        supabase.table("daily_streaks").insert({
            "user_id": user_id,
            "current_streak": 1,
            "longest_streak": 1,
            "last_completed_date": str(today)
        }).execute()
        return

    s = streak.data[0]
    last = s.get("last_completed_date")

    if last == str(today):
        return  # already updated today

    from datetime import timedelta
    yesterday = str(today - timedelta(days=1))

    if last == yesterday:
        new_streak = s["current_streak"] + 1
    else:
        new_streak = 1

    longest = max(new_streak, s.get("longest_streak", 1))

    supabase.table("daily_streaks").update({
        "current_streak": new_streak,
        "longest_streak": longest,
        "last_completed_date": str(today)
    }).eq("user_id", user_id).execute()

    # Bonus points for streaks
    if new_streak % 7 == 0:
        award_points(user_id, 50, "streak", note=f"{new_streak} day streak bonus!")

def update_pet_xp(user_id: str, xp_gain: int):
    """Add XP to pet and level up if threshold reached."""
    companion = supabase.table("companions")\
        .select("*")\
        .eq("user_id", user_id)\
        .single()\
        .execute()

    if not companion.data:
        return

    pet = companion.data
    new_xp = pet["xp"] + xp_gain
    new_level = pet["level"]

    # Every 100 XP = 1 level
    xp_threshold = new_level * 100
    if new_xp >= xp_threshold:
        new_level += 1
        new_xp = new_xp - xp_threshold

    supabase.table("companions").update({
        "xp": new_xp,
        "level": new_level,
        "updated_at": datetime.utcnow().isoformat()
    }).eq("id", pet["id"]).execute()