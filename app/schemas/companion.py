from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID

class CompanionCreate(BaseModel):
    name: str
    species: str = "dog"
    personality: str = "cheerful"

class CompanionResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    species: str
    personality: str
    level: int
    xp: int
    mood_state: str
    energy: int
    affection: int
    created_at: datetime

    class Config:
        from_attributes = True

class ChatMessage(BaseModel):
    message: str
    thread_id: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    thread_id: str
    user_message_id: str
    assistant_message_id: str