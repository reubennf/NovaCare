# app/schemas/profile.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ProfileUpdate(BaseModel):
    preferred_name: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    pet_type: Optional[str] = None
    pet_name: Optional[str] = None
    pet_level: Optional[int] = None
    pet_renamed_at: Optional[datetime] = None
    caregiver_name: Optional[str] = None
    font_size: Optional[str] = None
    healthhub_connected: Optional[bool] = None

class ProfileResponse(BaseModel):
    id: str
    email: Optional[str] = None
    preferred_name: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    pet_type: Optional[str] = None
    pet_name: Optional[str] = None
    pet_level: Optional[int] = None
    pet_renamed_at: Optional[datetime] = None
    caregiver_name: Optional[str] = None
    font_size: Optional[str] = None
    healthhub_connected: Optional[bool] = None

    class Config:
        from_attributes = True