"""
Authentication routes for user registration, login, token management
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import logging

from database import get_db_session, UserCRUD, RefreshTokenCRUD
from .models import (
    UserRegisterRequest, 
    UserLoginRequest, 
    RefreshTokenRequest,
    ValidateTokenRequest,
    LogoutRequest,
    TokenResponse, 
    RefreshResponse,
    ValidationResponse,
    UserResponse,
    TierInfoResponse,
    ErrorResponse
)
from .utils import (
    verify_password, 
    hash_password, 
    create_access_token, 
    create_refresh_token,
    verify_token,
    get_user_id_from_token,
    get_tier_features,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS
)

router = APIRouter()
security = HTTPBearer()
logger = logging.getLogger(__name__)

# Authentication dependency
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db_session)
):
    """Get current authenticated user from JWT token"""
    user_id = get_user_id_from_token(credentials.credentials)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_crud = UserCRUD(db)
    user = user_crud.get_user_by_id(user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user

@router.post("/register", response_model=TokenResponse)
async def register_user(
    user_data: UserRegisterRequest,
    db: Session = Depends(get_db_session)
):
    """Register a new user"""
    try:
        user_crud = UserCRUD(db)
        
        # Check if user already exists
        existing_user = user_crud.get_user_by_email(user_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Hash password and create user
        hashed_password = hash_password(user_data.password)
        user = user_crud.create_user(
            email=user_data.email,
            full_name=user_data.full_name,
            hashed_password=hashed_password
        )
        
        # Create tokens
        access_token = create_access_token(data={"user_id": user.id, "email": user.email})
        refresh_token_str = create_refresh_token()
        
        # Store refresh token
        refresh_crud = RefreshTokenCRUD(db)
        expires_at = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        refresh_crud.create_refresh_token(user.id, refresh_token_str, expires_at)
        
        logger.info(f"User registered: {user.email}")
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token_str,
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserResponse.from_orm(user)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )

@router.post("/login", response_model=TokenResponse)
async def login_user(
    login_data: UserLoginRequest,
    db: Session = Depends(get_db_session)
):
    """Authenticate user and return tokens"""
    try:
        user_crud = UserCRUD(db)
        
        # Get user by email
        user = user_crud.get_user_by_email(login_data.email)
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Verify password
        if not verify_password(login_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Update last login
        user_crud.update_user_login(user.id)
        
        # Create tokens
        access_token = create_access_token(data={"user_id": user.id, "email": user.email})
        refresh_token_str = create_refresh_token()
        
        # Store refresh token
        refresh_crud = RefreshTokenCRUD(db)
        expires_at = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        refresh_crud.create_refresh_token(user.id, refresh_token_str, expires_at)
        
        logger.info(f"User logged in: {user.email}")
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token_str,
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserResponse.from_orm(user)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )

@router.post("/refresh", response_model=RefreshResponse)
async def refresh_access_token(
    refresh_data: RefreshTokenRequest,
    db: Session = Depends(get_db_session)
):
    """Refresh access token using refresh token"""
    try:
        refresh_crud = RefreshTokenCRUD(db)
        
        # Validate refresh token
        stored_token = refresh_crud.get_refresh_token(refresh_data.refresh_token)
        if not stored_token or stored_token.expires_at < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token"
            )
        
        # Get user
        user_crud = UserCRUD(db)
        user = user_crud.get_user_by_id(stored_token.user_id)
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
        
        # Create new tokens
        new_access_token = create_access_token(data={"user_id": user.id, "email": user.email})
        new_refresh_token = create_refresh_token()
        
        # Revoke old refresh token and create new one
        refresh_crud.revoke_refresh_token(refresh_data.refresh_token)
        expires_at = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        refresh_crud.create_refresh_token(user.id, new_refresh_token, expires_at)
        
        logger.info(f"Token refreshed for user: {user.email}")
        
        return RefreshResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token refresh failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token refresh failed"
        )

@router.post("/validate", response_model=ValidationResponse)
async def validate_token(token_data: ValidateTokenRequest):
    """Validate an access token"""
    try:
        payload = verify_token(token_data.token)
        
        if not payload or payload.get("type") != "access":
            return ValidationResponse(valid=False)
        
        return ValidationResponse(
            valid=True,
            user_id=payload.get("user_id"),
            expires_at=datetime.fromtimestamp(payload.get("exp", 0))
        )
        
    except Exception as e:
        logger.error(f"Token validation failed: {e}")
        return ValidationResponse(valid=False)

@router.post("/logout")
async def logout_user(
    logout_data: LogoutRequest,
    db: Session = Depends(get_db_session)
):
    """Logout user by revoking refresh token"""
    try:
        refresh_crud = RefreshTokenCRUD(db)
        refresh_crud.revoke_refresh_token(logout_data.refresh_token)
        
        return {"message": "Successfully logged out"}
        
    except Exception as e:
        logger.error(f"Logout failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout failed"
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse.from_orm(current_user)

@router.get("/tier", response_model=TierInfoResponse)
async def get_user_tier_info(current_user = Depends(get_current_user)):
    """Get user's tier information and available features"""
    tier_info = get_tier_features(current_user.tier)
    return TierInfoResponse(**tier_info)