from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from uuid import UUID

class MissionTemplateResponse(BaseModel):
    id: UUID
    code: str
    title: str
    description: Optional[str]
    category: str
    difficulty: str
    base_points: int

    class Config:
        from_attributes = True

class UserMissionResponse(BaseModel):
    id: UUID
    user_id: UUID
    mission_template_id: UUID
    scheduled_for: date
    status: str
    progress_value: float
    target_value: float
    completed_at: Optional[datetime]
    generated_reason: Optional[str]

    class Config:
        from_attributes = True

class PointsResponse(BaseModel):
    total_points: int
    transactions: list

class ItemResponse(BaseModel):
    id: UUID
    item_type: str
    name: str
    rarity: str
    point_cost: int

    class Config:
        from_attributes = True

class PurchaseRequest(BaseModel):
    item_id: str

class StreakResponse(BaseModel):
    current_streak: int
    longest_streak: int
    last_completed_date: Optional[date]