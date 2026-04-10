from fastapi import APIRouter, HTTPException, Depends
from app.schemas.social import (
    EventResponse, RSVPRequest, RSVPResponse,
    FriendRequest, FriendshipResponse, FriendMessageRequest
)
from app.services.social_service import get_friend_ids, get_or_create_friend_thread
from app.core.db import supabase
from datetime import datetime
from app.core.auth import get_current_user_id


router = APIRouter(prefix="/social", tags=["social"])

# --- Events ---

@router.get("/events", response_model=list[EventResponse])
def get_events(user_id: str = Depends(get_current_user_id), category: str = None):
    query = supabase.table("community_events")\
        .select("*")\
        .eq("status", "active")\
        .order("starts_at")
    if category:
        query = query.eq("category", category)
    result = query.execute()
    return result.data

@router.get("/events/{event_id}", response_model=EventResponse)
def get_event(event_id: str, user_id: str = Depends(get_current_user_id)):
    result = supabase.table("community_events")\
        .select("*")\
        .eq("id", event_id)\
        .single()\
        .execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Event not found")
    return result.data

@router.post("/events/{event_id}/rsvp", response_model=RSVPResponse)
def rsvp_event(event_id: str, payload: RSVPRequest, user_id: str = Depends(get_current_user_id)):

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
def get_event_attendees(event_id: str, user_id: str = Depends(get_current_user_id)):
    result = supabase.table("event_rsvps")\
        .select("*, profiles(preferred_name, avatar_url)")\
        .eq("event_id", event_id)\
        .eq("status", "joined")\
        .execute()
    return result.data

@router.get("/my-events")
def get_my_events(user_id: str = Depends(get_current_user_id)):
    result = supabase.table("event_rsvps")\
        .select("*, community_events(*)")\
        .eq("user_id", user_id)\
        .execute()
    return result.data

# --- Friendships ---

@router.post("/friends/request")
def send_friend_request(payload: FriendRequest, user_id: str = Depends(get_current_user_id)):

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
def accept_friend_request(friendship_id: str, user_id: str = Depends(get_current_user_id)):
    result = supabase.table("friendships")\
        .update({"status": "accepted"})\
        .eq("id", friendship_id)\
        .eq("user_id_2", user_id)\
        .execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Friend request not found")
    return result.data[0]

@router.get("/friends", response_model=list[FriendshipResponse])
def get_friends(user_id: str = Depends(get_current_user_id)):
    result = supabase.table("friendships")\
        .select("*")\
        .eq("status", "accepted")\
        .or_(f"user_id_1.eq.{user_id},user_id_2.eq.{user_id}")\
        .execute()
    return result.data

@router.get("/friends/pending")
def get_pending_requests(user_id: str = Depends(get_current_user_id)):
    result = supabase.table("friendships")\
        .select("*, profiles!friendships_user_id_1_fkey(preferred_name, avatar_url)")\
        .eq("user_id_2", user_id)\
        .eq("status", "pending")\
        .execute()
    return result.data

# --- Friend chat ---

@router.post("/friends/message")
def send_friend_message(payload: FriendMessageRequest, user_id: str = Depends(get_current_user_id)):

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
def get_friend_messages(friend_id: str, user_id: str = Depends(get_current_user_id)):

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

from pydantic import BaseModel
from typing import Optional

class LocationUpdate(BaseModel):
    latitude: float
    longitude: float
    visible: bool = True

class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: str = 'social'
    starts_at: str
    ends_at: Optional[str] = None
    venue_name: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class BumpRequest(BaseModel):
    friend_id: str
    latitude: float
    longitude: float

# --- Location ---

@router.post("/location")
def update_location(payload: LocationUpdate, user_id: str = Depends(get_current_user_id)):
    """Update user's real-time location."""
    import geohash2
    from datetime import datetime
    
    gh = geohash2.encode(payload.latitude, payload.longitude, precision=6)
    
    existing = supabase.table("user_presence").select("user_id").eq("user_id", user_id).execute()
    data = {
        "user_id": user_id,
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "geohash": gh,
        "visibility_status": "visible" if payload.visible else "hidden",
        "updated_at": datetime.utcnow().isoformat()
    }
    
    if existing.data:
        supabase.table("user_presence").update(data).eq("user_id", user_id).execute()
    else:
        supabase.table("user_presence").insert(data).execute()
    
    return {"message": "Location updated"}

@router.get("/friends/locations")
def get_friend_locations(user_id: str = Depends(get_current_user_id)):
    """Get locations of friends who are visible."""
    friend_ids = get_friend_ids(user_id)
    if not friend_ids:
        return []
    
    result = supabase.table("user_presence")\
        .select("user_id, latitude, longitude, updated_at")\
        .in_("user_id", friend_ids)\
        .eq("visibility_status", "visible")\
        .execute()
    
    # Enrich with profile names
    locations = []
    for loc in (result.data or []):
        profile = supabase.table("profiles")\
            .select("preferred_name, avatar_url")\
            .eq("id", loc["user_id"])\
            .execute()
        name = profile.data[0].get("preferred_name", "Friend") if profile.data else "Friend"
        locations.append({**loc, "name": name})
    
    return locations

@router.post("/location/hide")
def hide_location(user_id: str = Depends(get_current_user_id)):
    supabase.table("user_presence").update({
        "visibility_status": "hidden"
    }).eq("user_id", user_id).execute()
    return {"message": "Location hidden"}

# --- Create event ---

@router.post("/events/create")
def create_event(payload: EventCreate, user_id: str = Depends(get_current_user_id)):
    """Let users create their own community events."""
    profile = supabase.table("profiles").select("preferred_name").eq("id", user_id).execute()
    organizer = profile.data[0].get("preferred_name", "Community member") if profile.data else "Community member"
    
    result = supabase.table("community_events").insert({
        "title": payload.title,
        "description": payload.description,
        "category": payload.category,
        "starts_at": payload.starts_at,
        "ends_at": payload.ends_at,
        "venue_name": payload.venue_name,
        "address": payload.address,
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "organizer_name": organizer,
        "source": "internal",
        "status": "active"
    }).execute()
    
    # Auto-RSVP creator as joined
    if result.data:
        supabase.table("event_rsvps").insert({
            "event_id": result.data[0]["id"],
            "user_id": user_id,
            "status": "joined"
        }).execute()
    
    return result.data[0] if result.data else {}

# --- BUMP ---

@router.post("/bump")
def bump_friend(payload: BumpRequest, user_id: str = Depends(get_current_user_id)):
    """
    Register a BUMP between two friends meeting in person.
    Both users must be friends and within 50 metres of each other.
    """
    import math
    from datetime import datetime, timedelta
    from app.services.mission_service import award_points

    # Must be friends
    friend_ids = get_friend_ids(user_id)
    if payload.friend_id not in friend_ids:
        raise HTTPException(status_code=403, detail="You can only bump friends")

    # Check friend's location
    friend_loc = supabase.table("user_presence")\
        .select("latitude, longitude, updated_at")\
        .eq("user_id", payload.friend_id)\
        .execute()
    
    if not friend_loc.data:
        raise HTTPException(status_code=400, detail="Friend location not available")
    
    floc = friend_loc.data[0]
    
    # Check location is recent (within 5 minutes)
    updated = datetime.fromisoformat(floc["updated_at"].replace("Z", "+00:00")).replace(tzinfo=None)
    if (datetime.utcnow() - updated).total_seconds() > 300:
        raise HTTPException(status_code=400, detail="Friend location is outdated")

    # Calculate distance in metres (Haversine)
    R = 6371000
    lat1, lon1 = math.radians(payload.latitude), math.radians(payload.longitude)
    lat2, lon2 = math.radians(floc["latitude"]), math.radians(floc["longitude"])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    distance = R * 2 * math.asin(math.sqrt(a))

    if distance > 50:
        raise HTTPException(status_code=400, detail=f"Too far apart ({int(distance)}m). Must be within 50m to BUMP!")

    # Check not bumped same friend in last hour
    one_hour_ago = (datetime.utcnow() - timedelta(hours=1)).isoformat()
    recent = supabase.table("bump_events")\
        .select("id")\
        .or_(f"and(user_id_1.eq.{user_id},user_id_2.eq.{payload.friend_id}),and(user_id_1.eq.{payload.friend_id},user_id_2.eq.{user_id})")\
        .gte("bumped_at", one_hour_ago)\
        .execute()
    
    if recent.data:
        raise HTTPException(status_code=400, detail="Already bumped this friend recently!")

    # Record bump
    supabase.table("bump_events").insert({
        "user_id_1": user_id,
        "user_id_2": payload.friend_id,
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "points_awarded": 20
    }).execute()

    # Award 20 points to BOTH users
    award_points(user_id, 20, "mission", note="BUMP with friend!")
    award_points(payload.friend_id, 20, "mission", note="BUMP with friend!")

    # Send notification to friend
    from app.services.notification_service import send_notification
    send_notification(
        user_id=payload.friend_id,
        title="You got bumped!",
        body="You and a friend just met up — you both earned 20 points!",
        payload={"type": "bump", "from_user": user_id}
    )

    return {
        "message": "BUMP successful!",
        "distance_metres": int(distance),
        "points_awarded": 20
    }

@router.get("/bumps")
def get_bump_history(user_id: str = Depends(get_current_user_id)):
    result = supabase.table("bump_events")\
        .select("*")\
        .or_(f"user_id_1.eq.{user_id},user_id_2.eq.{user_id}")\
        .order("bumped_at", desc=True)\
        .limit(20)\
        .execute()
    return result.data or []

@router.get("/bumps/photo/{bump_id}")
def get_bump_photo(bump_id: str, user_id: str = Depends(get_current_user_id)):
    """Generate AI caption for a bump meeting."""
    from app.core.config import settings
    from openai import OpenAI

    # Get bump details
    bump = supabase.table("bump_events")\
        .select("*")\
        .eq("id", bump_id)\
        .execute()
    
    if not bump.data:
        raise HTTPException(status_code=404, detail="Bump not found")
    
    bump_data = bump.data[0]

    # Get both users' companions
    user1_companion = supabase.table("companions")\
        .select("name, species")\
        .eq("user_id", bump_data["user_id_1"])\
        .execute()
    
    user2_companion = supabase.table("companions")\
        .select("name, species")\
        .eq("user_id", bump_data["user_id_2"])\
        .execute()

    pet1 = user1_companion.data[0] if user1_companion.data else {"name": "Sushi", "species": "dog"}
    pet2 = user2_companion.data[0] if user2_companion.data else {"name": "Mochi", "species": "cat"}

    # Get recent activity of both users
    user1_missions = supabase.table("user_missions")\
        .select("description")\
        .eq("user_id", bump_data["user_id_1"])\
        .eq("status", "completed")\
        .order("completed_at", desc=True)\
        .limit(3)\
        .execute()
    
    user2_missions = supabase.table("user_missions")\
        .select("description")\
        .eq("user_id", bump_data["user_id_2"])\
        .eq("status", "completed")\
        .order("completed_at", desc=True)\
        .limit(3)\
        .execute()

    activities1 = [m["description"] for m in (user1_missions.data or [])]
    activities2 = [m["description"] for m in (user2_missions.data or [])]
    all_activities = activities1 + activities2

    client = OpenAI(
        api_key=settings.SEA_LION_API_KEY,
        base_url="https://api.sea-lion.ai/v1"
    )

    activity_context = ", ".join(all_activities) if all_activities else "going for a walk"

    prompt = f"""Two virtual pets just met in real life! Generate a fun short photo caption.

Pet 1: {pet1['name']} the {pet1['species']}
Pet 2: {pet2['name']} the {pet2['species']}
Recent activities: {activity_context}

Generate:
1. A fun scene description (what the pets are doing together, based on their activities)
2. A short caption (max 10 words, fun and cute)

Return ONLY JSON like this:
{{"scene": "Swimming together at the pool", "caption": "Best swim buddies ever! 🏊"}}"""

    try:
        response = client.chat.completions.create(
            model="aisingapore/Gemma-SEA-LION-v4-27B-IT",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=100,
            extra_body={"chat_template_kwargs": {"thinking_mode": "off"}}
        )
        import json
        text = response.choices[0].message.content.strip()
        text = text.replace("```json", "").replace("```", "").strip()
        data = json.loads(text)
        return {
            "bump_id": bump_id,
            "pet1": pet1,
            "pet2": pet2,
            "scene": data.get("scene", "Playing together"),
            "caption": data.get("caption", "Best friends! 🐾"),
            "bumped_at": bump_data.get("created_at")
        }
    except Exception as e:
        return {
            "bump_id": bump_id,
            "pet1": pet1,
            "pet2": pet2,
            "scene": "Playing together happily",
            "caption": "Best friends! 🐾",
            "bumped_at": bump_data.get("created_at")
        }