from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from datetime import datetime, timezone
from app.schemas.profile import ProfileUpdate, ProfileResponse
from app.core.db import supabase
from app.core.auth import get_current_user_id
import uuid

router = APIRouter(prefix="/profile", tags=["profile"])

@router.get("/", response_model=ProfileResponse)
def get_my_profile(user_id: str = Depends(get_current_user_id)):
    result = supabase.table("profiles").select("*").eq("id", user_id).maybe_single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return result.data

@router.patch("/", response_model=ProfileResponse)
def update_my_profile(payload: ProfileUpdate, user_id: str = Depends(get_current_user_id)):
    updates = payload.model_dump(exclude_none=True)
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = supabase.table("profiles").update(updates).eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Update failed")
    return result.data[0]

@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id)
):
    contents = await file.read()
    ext = file.filename.split(".")[-1].lower()
    if ext not in ["jpg", "jpeg", "png", "webp"]:
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    path = f"{user_id}.{ext}"
    supabase.storage.from_("avatars").upload(path, contents, {
        "content-type": file.content_type,
        "upsert": "true"
    })
    public_url = supabase.storage.from_("avatars").get_public_url(path)
    
    supabase.table("profiles").update({
        "avatar_url": public_url,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", user_id).execute()
    
    return {"avatar_url": public_url}