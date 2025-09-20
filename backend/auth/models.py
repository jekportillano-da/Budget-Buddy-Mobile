"""
Pydantic models for authentication requests and responses
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any
from datetime import datetime

# Request models
class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")
    full_name: str = Field(..., min_length=1, description="Full name is required")

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class ValidateTokenRequest(BaseModel):
    token: str

class LogoutRequest(BaseModel):
    refresh_token: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6, description="Password must be at least 6 characters")

# Response models
class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    tier: str
    total_savings: float
    email_verified: bool
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds until expiration
    user: UserResponse

class RefreshResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer" 
    expires_in: int

class ValidationResponse(BaseModel):
    valid: bool
    user_id: Optional[int] = None
    tier: Optional[str] = None
    expires_at: Optional[datetime] = None

class TierInfoResponse(BaseModel):
    tier: str
    level: int
    features: Dict[str, bool]
    limits: Dict[str, int]

class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None

class MessageResponse(BaseModel):
    message: str