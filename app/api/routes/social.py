from fastapi import APIRouter, HTTPException, Header
from app.schemas.social import (
    EventResponse, RSVPRequest, RSVPResponse,
    FriendRequest, FriendshipResponse, FriendMessageRequest
)
from app.services.social_service import get_friend_ids, get_or_create_friend_thread
from app.core.db import supabase
from datetime import datetime

router = APIRouter(prefix="/social", tags=["social"])

def get_user_id(authorization: str) -> str:
    token = authorization.replace("Bearer ", "")
    user = supabase.auth.get_user(token)
    if not user or not user.user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user.user.id

# --- Events ---

@router.get("/events", response_model=list[EventResponse])
def get_events(authorization: str = Header(...), category: str = None):
    get_user_id(authorization)
    query = supabase.table("community_events")\
        .select("*")\
        .eq("status", "active")\
        .order("starts_at")
    if category:
        query = query.eq("category", category)
    result = query.execute()
    return result.data

@router.get("/events/{event_id}", response_model=EventResponse)
def get_event(event_id: str, authorization: str = Header(...)):
    get_user_id(authorization)
    result = supabase.table("community_events")\
        .select("*")\
        .eq("id", event_id)\
        .single()\
        .execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Event not found")
    return result.data

@router.post("/events/{event_id}/rsvp", response_model=RSVPResponse)
def rsvp_event(event_id: str, payload: RSVPRequest, authorization: str = Header(...)):
    user_id = get_user_id(authorization)

    # Check event exists
    event = supabase.table("community_events")\
        .select("id, capacity")\
        .eq("id", event_id)\
        .single()\
        .execute()
    if not event.data:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check capacity if set
    if event.data.get("capacity"):
        rsvp_count = supabase.table("event_rsvps")\
            .select("id")\
            .eq("event_id", event_id)\
            .eq("status", "joined")\
            .execute()
        if len(rsvp_count.data or []) >= event.data["capacity"]:
            raise HTTPException(status_code=400, detail="Event is full")

    # Upsert RSVP
    existing = supabase.table("event_rsvps")\
        .select("*")\
        .eq("event_id", event_id)\
        .eq("user_id", user_id)\
        .execute()

    if existing.data:
        result = supabase.table("event_rsvps")\
            .update({"status": payload.status})\
            .eq("event_id", event_id)\
            .eq("user_id", user_id)\
            .execute()
    else:
        result = supabase.table("event_rsvps")\
            .insert({
                "event_id": event_id,
                "user_id": user_id,
                "status": payload.status
            }).execute()

    return result.data[0]

@router.get("/events/{event_id}/attendees")
def get_event_attendees(event_id: str, authorization: str = Header(...)):
    get_user_id(authorization)
    result = supabase.table("event_rsvps")\
        .select("*, profiles(preferred_name, avatar_url)")\
        .eq("event_id", event_id)\
        .eq("status", "joined")\
        .execute()
    return result.data

@router.get("/my-events")
def get_my_events(authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    result = supabase.table("event_rsvps")\
        .select("*, community_events(*)")\
        .eq("user_id", user_id)\
        .execute()
    return result.data

# --- Friendships ---

@router.post("/friends/request")
def send_friend_request(payload: FriendRequest, authorization: str = Header(...)):
    user_id = get_user_id(authorization)

    if user_id == payload.target_user_id:
        raise HTTPException(status_code=400, detail="Cannot add yourself")

    # Check if friendship already exists
    existing = supabase.table("friendships")\
        .select("*")\
        .or_(
            f"and(user_id_1.eq.{user_id},user_id_2.eq.{payload.target_user_id}),"
            f"and(user_id_1.eq.{payload.target_user_id},user_id_2.eq.{user_id})"
        )\
        .execute()

    if existing.data:
        raise HTTPException(status_code=400, detail="Friendship already exists")

    result = supabase.table("friendships").insert({
        "user_id_1": user_id,
        "user_id_2": payload.target_user_id,
        "status": "pending"
    }).execute()

    return result.data[0]

@router.patch("/friends/{friendship_id}/accept")
def accept_friend_request(friendship_id: str, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    result = supabase.table("friendships")\
        .update({"status": "accepted"})\
        .eq("id", friendship_id)\
        .eq("user_id_2", user_id)\
        .execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Friend request not found")
    return result.data[0]

@router.get("/friends", response_model=list[FriendshipResponse])
def get_friends(authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    result = supabase.table("friendships")\
        .select("*")\
        .eq("status", "accepted")\
        .or_(f"user_id_1.eq.{user_id},user_id_2.eq.{user_id}")\
        .execute()
    return result.data

@router.get("/friends/pending")
def get_pending_requests(authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    result = supabase.table("friendships")\
        .select("*, profiles!friendships_user_id_1_fkey(preferred_name, avatar_url)")\
        .eq("user_id_2", user_id)\
        .eq("status", "pending")\
        .execute()
    return result.data

# --- Friend chat ---

@router.post("/friends/message")
def send_friend_message(payload: FriendMessageRequest, authorization: str = Header(...)):
    user_id = get_user_id(authorization)

    # Verify they are actually friends
    friend_ids = get_friend_ids(user_id)
    if payload.friend_id not in friend_ids:
        raise HTTPException(status_code=403, detail="You can only message friends")

    thread_id = get_or_create_friend_thread(user_id, payload.friend_id)

    result = supabase.table("conversation_messages").insert({
        "thread_id": thread_id,
        "sender_type": "user",
        "sender_user_id": user_id,
        "body": payload.message
    }).execute()

    # Update thread last_message_at
    supabase.table("conversation_threads").update({
        "last_message_at": datetime.utcnow().isoformat()
    }).eq("id", thread_id).execute()

    return {
        "message_id": result.data[0]["id"],
        "thread_id": thread_id
    }

@router.get("/friends/{friend_id}/messages")
def get_friend_messages(friend_id: str, authorization: str = Header(...)):
    user_id = get_user_id(authorization)

    friend_ids = get_friend_ids(user_id)
    if friend_id not in friend_ids:
        raise HTTPException(status_code=403, detail="Not friends with this user")

    thread_id = get_or_create_friend_thread(user_id, friend_id)

    result = supabase.table("conversation_messages")\
        .select("*")\
        .eq("thread_id", thread_id)\
        .order("created_at")\
        .execute()
    return result.data