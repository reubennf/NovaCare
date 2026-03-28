from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from uuid import UUID

class SupportContactCreate(BaseModel):
    name: str
    relationship: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    can_view_summaries: bool = False
    can_receive_alerts: bool = False

class SupportContactResponse(SupportContactCreate):
    id: UUID
    senior_user_id: UUID
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class BehaviorSignalResponse(BaseModel):
    id: UUID
    signal_type: str
    score: Optional[float]
    detected_at: datetime
    details: Optional[dict]

    class Config:
        from_attributes = True

class RiskFlagResponse(BaseModel):
    id: UUID
    level: str
    title: str
    description: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class CareSummaryResponse(BaseModel):
    id: UUID
    period_start: date
    period_end: date
    summary_type: str
    summary_text: str
    risk_level: str
    generated_at: datetime

    class Config:
        from_attributes = True