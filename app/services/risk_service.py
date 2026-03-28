from app.core.db import supabase
from app.core.config import settings
from openai import OpenAI
from datetime import datetime, date, timedelta

sea_lion_client = OpenAI(
    api_key=settings.SEA_LION_API_KEY,
    base_url="https://api.sea-lion.ai/v1"
)

SEA_LION_MODEL = "aisingapore/Gemma-SEA-LION-v4-27B-IT"

def scan_missed_medications(user_id: str) -> list:
    """Detect missed medications in the last 3 days."""
    three_days_ago = (datetime.utcnow() - timedelta(days=3)).isoformat()
    result = supabase.table("medication_logs")\
        .select("*")\
        .eq("user_id", user_id)\
        .eq("status", "missed")\
        .gte("due_at", three_days_ago)\
        .execute()

    signals = []
    for log in (result.data or []):
        signal = {
            "user_id": user_id,
            "signal_type": "missed_medication",
            "score": 0.8,
            "source_table": "medication_logs",
            "source_id": log["id"],
            "details": {"due_at": log["due_at"]}
        }
        supabase.table("behavior_signals").insert(signal).execute()
        signals.append(signal)

    return signals

def scan_low_sentiment(user_id: str) -> list:
    """Detect consistently low mood in recent messages."""
    three_days_ago = (datetime.utcnow() - timedelta(days=3)).isoformat()

    analysis = supabase.table("message_analysis")\
        .select("*, conversation_messages(created_at)")\
        .execute()

    # Filter low mood messages for this user's recent threads
    threads = supabase.table("conversation_threads")\
        .select("id")\
        .eq("user_id", user_id)\
        .execute()

    thread_ids = [t["id"] for t in (threads.data or [])]
    if not thread_ids:
        return []

    messages = supabase.table("conversation_messages")\
        .select("id, created_at")\
        .in_("thread_id", thread_ids)\
        .gte("created_at", three_days_ago)\
        .execute()

    message_ids = [m["id"] for m in (messages.data or [])]
    if not message_ids:
        return []

    low_mood = supabase.table("message_analysis")\
        .select("*")\
        .in_("message_id", message_ids)\
        .eq("mood_label", "low")\
        .execute()

    signals = []
    if len(low_mood.data or []) >= 3:
        signal = {
            "user_id": user_id,
            "signal_type": "low_sentiment",
            "score": 0.7,
            "source_table": "message_analysis",
            "details": {"low_mood_count": len(low_mood.data)}
        }
        supabase.table("behavior_signals").insert(signal).execute()
        signals.append(signal)

    return signals

def scan_missed_missions(user_id: str) -> list:
    """Detect if user has not completed any missions in 3 days."""
    three_days_ago = str(date.today() - timedelta(days=3))
    result = supabase.table("user_missions")\
        .select("*")\
        .eq("user_id", user_id)\
        .eq("status", "completed")\
        .gte("scheduled_for", three_days_ago)\
        .execute()

    signals = []
    if not result.data:
        signal = {
            "user_id": user_id,
            "signal_type": "missed_missions",
            "score": 0.5,
            "source_table": "user_missions",
            "details": {"days_without_completion": 3}
        }
        supabase.table("behavior_signals").insert(signal).execute()
        signals.append(signal)

    return signals

def evaluate_risk(user_id: str) -> dict:
    """Run all scans and create a risk flag if needed."""
    all_signals = []
    all_signals.extend(scan_missed_medications(user_id))
    all_signals.extend(scan_low_sentiment(user_id))
    all_signals.extend(scan_missed_missions(user_id))

    if not all_signals:
        return {"risk_level": "low", "signals": 0}

    # Determine risk level based on signal count and types
    high_risk_types = {"missed_medication", "low_sentiment"}
    high_signals = [s for s in all_signals if s["signal_type"] in high_risk_types]

    if len(high_signals) >= 2:
        level = "high"
    elif len(all_signals) >= 2:
        level = "medium"
    else:
        level = "low"

    # Create risk flag
    supabase.table("risk_flags").insert({
        "user_id": user_id,
        "level": level,
        "title": f"{len(all_signals)} concern(s) detected",
        "description": f"Signals: {', '.join(set(s['signal_type'] for s in all_signals))}",
        "status": "open"
    }).execute()

    return {"risk_level": level, "signals": len(all_signals)}

def generate_weekly_summary(user_id: str) -> str:
    """Use SEA-LION to generate a natural language weekly summary."""
    today = date.today()
    week_ago = today - timedelta(days=7)

    # Gather data for the week
    med_logs = supabase.table("medication_logs")\
        .select("status")\
        .eq("user_id", user_id)\
        .gte("due_at", week_ago.isoformat())\
        .execute()

    missions = supabase.table("user_missions")\
        .select("status")\
        .eq("user_id", user_id)\
        .gte("scheduled_for", str(week_ago))\
        .execute()

    signals = supabase.table("behavior_signals")\
        .select("signal_type, score")\
        .eq("user_id", user_id)\
        .gte("detected_at", week_ago.isoformat())\
        .execute()

    profile = supabase.table("profiles")\
        .select("preferred_name")\
        .eq("id", user_id)\
        .single()\
        .execute()

    name = profile.data.get("preferred_name", "the user") if profile.data else "the user"

    # Calculate stats
    total_meds = len(med_logs.data or [])
    taken_meds = len([m for m in (med_logs.data or []) if m["status"] == "taken"])
    completed_missions = len([m for m in (missions.data or []) if m["status"] == "completed"])
    total_missions = len(missions.data or [])
    signal_types = list(set(s["signal_type"] for s in (signals.data or [])))

    prompt = f"""Write a short, warm weekly health summary for a caregiver about their elderly family member named {name}.

Data for this week:
- Medications taken: {taken_meds} out of {total_meds}
- Daily missions completed: {completed_missions} out of {total_missions}
- Concerns detected: {', '.join(signal_types) if signal_types else 'none'}

Write 3-4 sentences in a warm, caring tone. Be honest but reassuring. 
Mention what went well and any areas that need attention.
Do not use bullet points. Write as flowing prose."""

    response = sea_lion_client.chat.completions.create(
        model=SEA_LION_MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=300,
        extra_body={"chat_template_kwargs": {"thinking_mode": "off"}}
    )

    return response.choices[0].message.content