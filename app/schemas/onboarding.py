from pydantic import BaseModel
from typing import Optional, List

class OnboardingPayload(BaseModel):
    # Accessibility
    text_size: Optional[str] = "normal"
    voice_mode_enabled: Optional[bool] = False
    high_contrast_enabled: Optional[bool] = False
    # HealthHub
    healthhub_sync: Optional[bool] = False
    # Doctor
    assigned_doctor: Optional[str] = None
    # Medication
    takes_daily_medication: Optional[bool] = False
    # Support
    has_support_person: Optional[bool] = False
    # Conditions
    health_conditions: Optional[List[str]] = []