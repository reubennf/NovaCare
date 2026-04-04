from openai import OpenAI
from app.core.config import settings
from app.core.db import supabase
import json

client = OpenAI(
    api_key=settings.SEA_LION_API_KEY,
    base_url="https://api.sea-lion.ai/v1"
)

SEA_LION_MODEL = "aisingapore/Gemma-SEA-LION-v4-27B-IT"

def build_system_prompt(companion: dict, user_profile: dict, memories: list) -> str:
    name = companion.get("name", "Buddy")
    species = companion.get("species", "dog")
    personality = companion.get("personality", "cheerful")
    user_name = user_profile.get("preferred_name") or user_profile.get("full_name") or "friend"

    # Get health conditions
    conditions_result = supabase.table("user_health_conditions")\
        .select("condition")\
        .eq("user_id", user_profile.get("id", ""))\
        .execute()
    conditions = [c["condition"] for c in (conditions_result.data or [])]

    # Get accessibility prefs
    text_size = "normal"
    voice_mode = False
    accessibility = supabase.table("accessibility_preferences")\
        .select("*")\
        .eq("user_id", user_profile.get("id", ""))\
        .execute()
    if accessibility.data:
        text_size = accessibility.data[0].get("text_size", "normal")
        voice_mode = accessibility.data[0].get("voice_mode_enabled", False)

    memory_text = ""
    if memories:
        memory_lines = [f"- {m['summary']}" for m in memories]
        memory_text = "\n".join(memory_lines)

    personality_traits = {
        "cheerful": "warm, upbeat, encouraging and playful",
        "calm": "gentle, soothing, patient and reassuring",
        "gentle": "soft-spoken, kind, empathetic and caring"
    }
    traits = personality_traits.get(personality, "warm and friendly")

    # Adjust response style based on accessibility
    style_notes = ""
    if text_size in ("large", "extra_large"):
        style_notes += "Use very short sentences. Keep responses under 2 sentences. "
    if voice_mode:
        style_notes += "Respond as if speaking out loud — avoid lists, use natural speech. "

    conditions_text = ", ".join(conditions) if conditions else "none reported"
    takes_meds = user_profile.get("takes_daily_medication", False)
    has_support = user_profile.get("has_support_person", False)

    return f"""You are {name}, a {species} companion who is {traits}.
You are talking with {user_name}, an elderly person in Singapore who you care deeply about.

Health information about {user_name}:
- Known health conditions: {conditions_text}
- Takes daily medication: {"yes" if takes_meds else "no"}
- Has a support person: {"yes" if has_support else "no"}

Your role is to:
- Be a warm, supportive daily companion
- Gently encourage healthy habits — especially medication reminders if they take daily meds
- Listen carefully and respond with empathy
- Keep messages short and easy to read (1-3 sentences max)
- Never give medical advice — always suggest speaking to a doctor for health concerns
- Use simple, clear language, use Singlish to feel more natural
- {style_notes}

What you know about {user_name}:
{memory_text if memory_text else "Still getting to know them."}

Always stay in character as {name} the {species}. Be warm but never patronizing."""

def get_recent_messages(thread_id: str, limit: int = 10) -> list:
    result = supabase.table("conversation_messages")\
        .select("sender_type, body")\
        .eq("thread_id", thread_id)\
        .order("created_at", desc=False)\
        .limit(limit)\
        .execute()
    messages = result.data or []

    # Convert to openai format
    formatted = []
    for m in messages:
        if m.get("body"):
            role = "user" if m["sender_type"] == "user" else "assistant"
            formatted.append({"role": role, "content": m["body"]})

    # Enforce strict alternating — must start with user, end with assistant
    # Remove trailing user messages (the new one will be appended fresh)
    while formatted and formatted[-1]["role"] == "user":
        formatted.pop()

    return formatted


def chat_with_companion(
    user_message: str,
    thread_id: str,
    companion: dict,
    user_profile: dict,
    memories: list
) -> str:
    system_prompt = build_system_prompt(companion, user_profile, memories)
    history = get_recent_messages(thread_id)

    # Build final message list
    if not history:
        # First ever message — inject system prompt into user message
        messages = [
            {"role": "user", "content": f"{system_prompt}\n\nUser message: {user_message}"}
        ]
    else:
        # Inject system prompt into the very first message
        history[0]["content"] = f"{system_prompt}\n\nUser message: {history[0]['content']}"
        # Append new user message at the end
        history.append({"role": "user", "content": user_message})
        messages = history

    response = client.chat.completions.create(
        model=SEA_LION_MODEL,
        messages=messages,
        max_tokens=300,
        extra_body={
            "chat_template_kwargs": {"thinking_mode": "off"}
        }
    )
    return response.choices[0].message.content

def analyze_sentiment(message: str) -> dict:
    response = client.chat.completions.create(
        model=SEA_LION_MODEL,
        messages=[
            {
                "role": "system",
                "content": """Analyze the sentiment of this message from an elderly user.
Respond ONLY with JSON in this exact format with no extra text:
{"sentiment_score": 0.5, "mood_label": "positive", "loneliness_score": 0.1, "anxiety_score": 0.1, "intent_tags": ["greeting"], "risk_tags": []}

mood_label must be one of: positive, neutral, low
All scores are between -1 and 1 for sentiment, 0 and 1 for others."""
            },
            {"role": "user", "content": message}
        ],
        max_tokens=200,
        extra_body={
            "chat_template_kwargs": {"thinking_mode": "off"}
        }
    )
    try:
        return json.loads(response.choices[0].message.content)
    except Exception:
        return {
            "sentiment_score": 0,
            "mood_label": "neutral",
            "loneliness_score": 0,
            "anxiety_score": 0,
            "intent_tags": [],
            "risk_tags": []
        }