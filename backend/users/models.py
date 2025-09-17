"""
Pydantic models for user management
"""

from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from datetime import datetime

class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None

class UserProfileResponse(BaseModel):
    id: int
    email: str
    full_name: str
    tier: str
    total_savings: float
    email_verified: bool
    created_at: datetime
    last_login: Optional[datetime]
    tier_info: Dict[str, Any]

    class Config:
        from_attributes = True

class TierUpdateRequest(BaseModel):
    total_savings: float