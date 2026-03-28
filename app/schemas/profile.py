from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date, datetime
from uuid import UUID

class ProfileBase(BaseModel):
    preferred_name: Optional[str] = None
    full_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    timezone: Optional[str] = "Asia/Singapore"
    locale: Optional[str] = "en-SG"
    avatar_url: Optional[str] = None

class ProfileUpdate(ProfileBase):
    pass

class ProfileResponse(ProfileBase):
    id: UUID
    email: Optional[str] = None
    onboarding_status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AccessibilityPrefsUpdate(BaseModel):
    text_size: Optional[str] = "normal"
    voice_mode_enabled: Optional[bool] = False
    high_contrast_enabled: Optional[bool] = False
    reduced_motion_enabled: Optional[bool] = False
    preferred_input_mode: Optional[str] = "text"

class AccessibilityPrefsResponse(AccessibilityPrefsUpdate):
    user_id: UUID
    updated_at: datetime

    class Config:
        from_attributes = True