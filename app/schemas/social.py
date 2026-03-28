from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID

class EventResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    category: Optional[str]
    starts_at: datetime
    ends_at: Optional[datetime]
    venue_name: Optional[str]
    address: Optional[str]
    organizer_name: Optional[str]
    capacity: Optional[int]
    status: str

    class Config:
        from_attributes = True

class RSVPRequest(BaseModel):
    status: str = "joined"

class RSVPResponse(BaseModel):
    id: UUID
    event_id: UUID
    user_id: UUID
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class FriendRequest(BaseModel):
    target_user_id: str

class FriendshipResponse(BaseModel):
    id: UUID
    user_id_1: UUID
    user_id_2: UUID
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class FriendMessageRequest(BaseModel):
    message: str
    friend_id: str