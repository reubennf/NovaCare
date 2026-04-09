from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from uuid import UUID

class MedicationCreate(BaseModel):
    name: str
    dosage_amount: Optional[float] = None
    dosage_unit: Optional[str] = None
    form: Optional[str] = None
    instructions: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class MedicationUpdate(BaseModel):
    name: Optional[str] = None
    dosage_amount: Optional[float] = None
    dosage_unit: Optional[str] = None
    form: Optional[str] = None
    instructions: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    active: Optional[bool] = None

class MedicationResponse(MedicationCreate):
    id: UUID
    user_id: UUID
    active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ScheduleCreate(BaseModel):
    schedule_type: str = "daily"
    times_per_day: int = 1
    time_slots: List[str] = ["08:00"]
    days_of_week: Optional[List[int]] = [1,2,3,4,5,6,7]
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    reminder_offset_minutes: int = 0

class ScheduleResponse(ScheduleCreate):
    id: UUID
    medication_id: UUID
    active: bool

    class Config:
        from_attributes = True

class MedicationLogUpdate(BaseModel):
    status: str
    note: Optional[str] = None

class MedicationLogResponse(BaseModel):
    id: UUID
    medication_schedule_id: Optional[UUID] = None
    medication_id: Optional[UUID] = None
    user_id: UUID
    due_at: datetime
    status: str
    taken_at: Optional[datetime] = None
    note: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

    class Config:
        from_attributes = True