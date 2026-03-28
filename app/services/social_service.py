from app.core.db import supabase

def get_friend_ids(user_id: str) -> list:
    """Get list of accepted friend user IDs."""
    result = supabase.table("friendships")\
        .select("user_id_1, user_id_2")\
        .eq("status", "accepted")\
        .or_(f"user_id_1.eq.{user_id},user_id_2.eq.{user_id}")\
        .execute()

    friend_ids = []
    for f in (result.data or []):
        if f["user_id_1"] == user_id:
            friend_ids.append(f["user_id_2"])
        else:
            friend_ids.append(f["user_id_1"])
    return friend_ids

def get_or_create_friend_thread(user_id: str, friend_id: str) -> str:
    """Get existing thread between two friends or create one."""
    # Check for existing thread with both users
    threads = supabase.table("conversation_threads")\
        .select("*")\
        .eq("user_id", user_id)\
        .eq("thread_type", "friend")\
        .execute()

    for thread in (threads.data or []):
        meta = thread.get("metadata") or {}
        if meta.get("friend_id") == friend_id:
            return thread["id"]

    # Create new thread
    result = supabase.table("conversation_threads").insert({
        "user_id": user_id,
        "thread_type": "friend",
        "title": "Friend chat",
        "metadata": {"friend_id": friend_id}
    }).execute()

    return result.data[0]["id"]