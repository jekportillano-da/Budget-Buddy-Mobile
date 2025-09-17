"""
Authentication utilities for JWT token management
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from decouple import config
import secrets

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT configuration
SECRET_KEY = config("SECRET_KEY", default="fallback-secret-key-change-in-production")
ALGORITHM = config("JWT_ALGORITHM", default="HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = config("ACCESS_TOKEN_EXPIRE_MINUTES", default=30, cast=int)
REFRESH_TOKEN_EXPIRE_DAYS = config("REFRESH_TOKEN_EXPIRE_DAYS", default=7, cast=int)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def hash_password(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token() -> str:
    """Create a secure refresh token"""
    return secrets.token_urlsafe(32)

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify and decode a JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

def get_user_id_from_token(token: str) -> Optional[int]:
    """Extract user ID from JWT token"""
    payload = verify_token(token)
    if payload and payload.get("type") == "access":
        return payload.get("user_id")
    return None

def validate_token_type(token: str, expected_type: str) -> bool:
    """Validate that a token is of the expected type"""
    payload = verify_token(token)
    return payload is not None and payload.get("type") == expected_type

# Tier-based access control
TIER_HIERARCHY = {
    "Starter": 0,
    "Bronze Saver": 1,
    "Silver Saver": 2,
    "Gold Saver": 3,
    "Platinum Saver": 4,
    "Diamond Saver": 5,
    "Elite Saver": 6
}

def check_tier_access(user_tier: str, required_tier: str) -> bool:
    """Check if user's tier meets the required tier for a feature"""
    user_level = TIER_HIERARCHY.get(user_tier, 0)
    required_level = TIER_HIERARCHY.get(required_tier, 0)
    return user_level >= required_level

def get_tier_features(tier: str) -> Dict[str, Any]:
    """Get available features for a tier"""
    tier_level = TIER_HIERARCHY.get(tier, 0)
    
    features = {
        "basic_ai_chat": tier_level >= 1,  # Bronze+
        "advanced_insights": tier_level >= 3,  # Gold+
        "unlimited_ai": tier_level >= 4,  # Platinum+
        "premium_themes": tier_level >= 2,  # Silver+
        "export_data": tier_level >= 3,  # Gold+
        "priority_support": tier_level >= 4,  # Platinum+
    }
    
    # Usage limits based on tier
    limits = {
        "ai_requests_per_day": {
            0: 3,    # Starter
            1: 10,   # Bronze
            2: 25,   # Silver
            3: 50,   # Gold
            4: -1,   # Platinum (unlimited)
            5: -1,   # Diamond (unlimited)
            6: -1    # Elite (unlimited)
        }.get(tier_level, 3),
        "insights_per_month": {
            0: 1,    # Starter
            1: 5,    # Bronze
            2: 15,   # Silver
            3: 30,   # Gold
            4: -1,   # Platinum (unlimited)
            5: -1,   # Diamond (unlimited)
            6: -1    # Elite (unlimited)
        }.get(tier_level, 1)
    }
    
    return {
        "tier": tier,
        "level": tier_level,
        "features": features,
        "limits": limits
    }