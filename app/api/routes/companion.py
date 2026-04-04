from fastapi import APIRouter, HTTPException, Depends
from app.schemas.companion import CompanionCreate, CompanionResponse, ChatMessage, ChatResponse
from app.services.chat_service import chat_with_companion, analyze_sentiment
from app.core.db import supabase
from app.core.auth import get_current_user_id
from datetime import datetime
import uuid
from fastapi.responses import StreamingResponse
import json

router = APIRouter(prefix="/companion", tags=["companion"])

@router.post("/", response_model=CompanionResponse)
def create_companion(payload: CompanionCreate, user_id: str = Depends(get_current_user_id)):
    existing = supabase.table("companions").select("*").eq("user_id", user_id).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Companion already exists for this user")
    data = payload.model_dump()
    data["user_id"] = user_id
    result = supabase.table("companions").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create companion")
    return result.data[0]

@router.get("/", response_model=CompanionResponse)
def get_companion(user_id: str = Depends(get_current_user_id)):
    result = supabase.table("companions").select("*").eq("user_id", user_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="No companion found. Create one first.")
    return result.data

@router.post("/chat/stream")
def chat_stream(payload: ChatMessage, user_id: str = Depends(get_current_user_id)):
    """Streaming chat endpoint."""
    from app.services.chat_service import build_system_prompt, get_recent_messages
    from app.core.config import settings
    from openai import OpenAI
    import uuid

    client = OpenAI(
        api_key=settings.SEA_LION_API_KEY,
        base_url="https://api.sea-lion.ai/v1"
    )

    # Get companion and profile
    companion_result = supabase.table("companions").select("*").eq("user_id", user_id).execute()
    if not companion_result.data:
        raise HTTPException(status_code=404, detail="No companion found")
    companion = companion_result.data[0]

    profile_result = supabase.table("profiles").select("*").eq("id", user_id).execute()
    user_profile = profile_result.data[0] if profile_result.data else {}

    memories_result = supabase.table("user_memories").select("*").eq("user_id", user_id).order("importance", desc=True).limit(10).execute()
    memories = memories_result.data or []

    # Get or create thread
    thread_id = payload.thread_id
    if not thread_id:
        thread_result = supabase.table("conversation_threads").insert({
            "user_id": user_id,
            "thread_type": "companion",
            "title": "Chat with " + companion["name"]
        }).execute()
        thread_id = thread_result.data[0]["id"]

    # Save user message
    user_msg_id = str(uuid.uuid4())
    supabase.table("conversation_messages").insert({
        "id": user_msg_id,
        "thread_id": thread_id,
        "sender_type": "user",
        "sender_user_id": user_id,
        "body": payload.message
    }).execute()

    # Build messages
    system_prompt = build_system_prompt(companion, user_profile, memories)
    history = get_recent_messages(thread_id)
    if not history:
        messages = [{"role": "user", "content": f"{system_prompt}\n\nUser message: {payload.message}"}]
    else:
        history[0]["content"] = f"{system_prompt}\n\nUser message: {history[0]['content']}"
        history.append({"role": "user", "content": payload.message})
        messages = history

    def generate():
        full_reply = ""
        assistant_msg_id = str(uuid.uuid4())

        # Send thread_id first so frontend knows it
        yield f"data: {json.dumps({'type': 'meta', 'thread_id': thread_id, 'assistant_msg_id': assistant_msg_id})}\n\n"

        try:
            stream = client.chat.completions.create(
                model="aisingapore/Gemma-SEA-LION-v4-27B-IT",
                messages=messages,
                max_tokens=300,
                stream=True,
                extra_body={"chat_template_kwargs": {"thinking_mode": "off"}}
            )

            for chunk in stream:
                delta = chunk.choices[0].delta.content
                if delta:
                    full_reply += delta
                    yield f"data: {json.dumps({'type': 'token', 'content': delta})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'content': 'Sorry, I had trouble responding.'})}\n\n"
            full_reply = "Sorry, I had trouble responding."

        # Save assistant message after streaming completes
        supabase.table("conversation_messages").insert({
            "id": assistant_msg_id,
            "thread_id": thread_id,
            "sender_type": "assistant",
            "body": full_reply
        }).execute()

        # Update thread
        from datetime import datetime
        supabase.table("conversation_threads").update({
            "last_message_at": datetime.utcnow().isoformat()
        }).eq("id", thread_id).execute()

        # Boost affection
        new_affection = min(100, companion["affection"] + 2)
        supabase.table("companions").update({
            "affection": new_affection,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", companion["id"]).execute()

        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )

@router.get("/threads")
def get_threads(user_id: str = Depends(get_current_user_id)):
    result = supabase.table("conversation_threads")\
        .select("*")\
        .eq("user_id", user_id)\
        .order("last_message_at", desc=True)\
        .execute()
    return result.data

@router.get("/threads/{thread_id}/messages")
def get_messages(thread_id: str, user_id: str = Depends(get_current_user_id)):
    thread = supabase.table("conversation_threads").select("*").eq("id", thread_id).eq("user_id", user_id).single().execute()
    if not thread.data:
        raise HTTPException(status_code=404, detail="Thread not found")
    result = supabase.table("conversation_messages")\
        .select("*")\
        .eq("thread_id", thread_id)\
        .order("created_at")\
        .execute()
    return result.data

@router.post("/chat/suggestions")
def get_suggestions(payload: ChatMessage, user_id: str = Depends(get_current_user_id)):
    """Generate contextual quick reply suggestions based on conversation."""
    from app.services.chat_service import get_recent_messages
    from app.core.config import settings
    from openai import OpenAI
    import json

    client = OpenAI(
        api_key=settings.SEA_LION_API_KEY,
        base_url="https://api.sea-lion.ai/v1"
    )

    history = get_recent_messages(payload.thread_id, limit=6)
    history_text = "\n".join([
        f"{'User' if m['role'] == 'user' else 'Pet'}: {m['content']}"
        for m in history
    ])

    response = client.chat.completions.create(
        model="aisingapore/Gemma-SEA-LION-v4-27B-IT",
        messages=[{
            "role": "user",
            "content": f"""Based on this conversation, suggest 3 short quick reply options the user might want to say next.
Return ONLY a JSON array of 3 strings. No explanation, no markdown, just the array.
Example: ["I feel better now", "Tell me more", "What should I do?"]

Conversation:
{history_text}

Rules:
- Each suggestion under 6 words
- Natural, conversational tone
- Relevant to what was just discussed
- Mix of emotional and action options"""
        }],
        max_tokens=100,
        extra_body={"chat_template_kwargs": {"thinking_mode": "off"}}
    )

    try:
        text = response.choices[0].message.content.strip()
        # Clean up any markdown
        text = text.replace("```json", "").replace("```", "").strip()
        suggestions = json.loads(text)
        if isinstance(suggestions, list) and len(suggestions) > 0:
            return {"suggestions": suggestions[:3]}
    except Exception:
        pass

    # Fallback suggestions
    return {"suggestions": ["Tell me more", "I feel better", "What should I do?"]}