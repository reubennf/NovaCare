from fastapi import APIRouter, HTTPException, Header
from app.schemas.companion import CompanionCreate, CompanionResponse, ChatMessage, ChatResponse
from app.services.chat_service import chat_with_companion, analyze_sentiment
from app.core.db import supabase
from datetime import datetime
import uuid

router = APIRouter(prefix="/companion", tags=["companion"])

def get_user_id(authorization: str) -> str:
    token = authorization.replace("Bearer ", "")
    user = supabase.auth.get_user(token)
    if not user or not user.user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user.user.id

@router.post("/", response_model=CompanionResponse)
def create_companion(payload: CompanionCreate, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    # check if companion already exists
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
def get_companion(authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    result = supabase.table("companions").select("*").eq("user_id", user_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="No companion found. Create one first.")
    return result.data

@router.post("/chat", response_model=ChatResponse)
def chat(payload: ChatMessage, authorization: str = Header(...)):
    user_id = get_user_id(authorization)

    # get companion
    companion_result = supabase.table("companions").select("*").eq("user_id", user_id).single().execute()
    if not companion_result.data:
        raise HTTPException(status_code=404, detail="No companion found. Create one first.")
    companion = companion_result.data

    # get user profile
    profile_result = supabase.table("profiles").select("*").eq("id", user_id).single().execute()
    user_profile = profile_result.data or {}

    # get user memories
    memories_result = supabase.table("user_memories").select("*").eq("user_id", user_id).order("importance", desc=True).limit(10).execute()
    memories = memories_result.data or []

    # get or create thread
    thread_id = payload.thread_id
    if not thread_id:
        thread_result = supabase.table("conversation_threads").insert({
            "user_id": user_id,
            "thread_type": "companion",
            "title": "Chat with " + companion["name"]
        }).execute()
        thread_id = thread_result.data[0]["id"]

    # save user message
    user_msg_id = str(uuid.uuid4())
    supabase.table("conversation_messages").insert({
        "id": user_msg_id,
        "thread_id": thread_id,
        "sender_type": "user",
        "sender_user_id": user_id,
        "body": payload.message
    }).execute()

    # get AI reply
    reply = chat_with_companion(
        user_message=payload.message,
        thread_id=thread_id,
        companion=companion,
        user_profile=user_profile,
        memories=memories
    )

    # save assistant message
    assistant_msg_id = str(uuid.uuid4())
    supabase.table("conversation_messages").insert({
        "id": assistant_msg_id,
        "thread_id": thread_id,
        "sender_type": "assistant",
        "body": reply
    }).execute()

    # analyze sentiment in background (fire and forget for now)
    try:
        analysis = analyze_sentiment(payload.message)
        analysis["message_id"] = user_msg_id
        analysis["analyzed_at"] = datetime.utcnow().isoformat()
        supabase.table("message_analysis").insert(analysis).execute()
    except Exception:
        pass

    # update thread last_message_at
    supabase.table("conversation_threads").update({
        "last_message_at": datetime.utcnow().isoformat()
    }).eq("id", thread_id).execute()

    # boost companion affection slightly after each chat
    new_affection = min(100, companion["affection"] + 2)
    supabase.table("companions").update({
        "affection": new_affection,
        "updated_at": datetime.utcnow().isoformat()
    }).eq("id", companion["id"]).execute()

    return {
        "reply": reply,
        "thread_id": thread_id,
        "user_message_id": user_msg_id,
        "assistant_message_id": assistant_msg_id
    }

@router.get("/threads")
def get_threads(authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    result = supabase.table("conversation_threads")\
        .select("*")\
        .eq("user_id", user_id)\
        .order("last_message_at", desc=True)\
        .execute()
    return result.data

@router.get("/threads/{thread_id}/messages")
def get_messages(thread_id: str, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    thread = supabase.table("conversation_threads").select("*").eq("id", thread_id).eq("user_id", user_id).single().execute()
    if not thread.data:
        raise HTTPException(status_code=404, detail="Thread not found")
    result = supabase.table("conversation_messages")\
        .select("*")\
        .eq("thread_id", thread_id)\
        .order("created_at")\
        .execute()
    return result.data