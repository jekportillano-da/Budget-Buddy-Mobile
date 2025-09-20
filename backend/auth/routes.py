"""
Authentication routes for user registration, login, token management
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import logging

from database import get_db_session, UserCRUD, RefreshTokenCRUD, PasswordResetTokenCRUD, PasswordResetToken
from .models import (
    UserRegisterRequest, 
    UserLoginRequest, 
    RefreshTokenRequest,
    ValidateTokenRequest,
    LogoutRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    TokenResponse, 
    RefreshResponse,
    ValidationResponse,
    UserResponse,
    TierInfoResponse,
    ErrorResponse,
    MessageResponse
)
from .utils import (
    verify_password, 
    hash_password, 
    create_access_token, 
    create_refresh_token,
    create_password_reset_token,
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

@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db_session)
):
    """Send password reset email to user"""
    try:
        user_crud = UserCRUD(db)
        user = user_crud.get_user_by_email(request.email)
        
        # Always return success for security (don't reveal if email exists)
        if user:
            # Create password reset token
            reset_token = create_password_reset_token()
            expires_at = datetime.utcnow() + timedelta(hours=1)  # 1 hour expiry
            
            # Store token in database
            reset_crud = PasswordResetTokenCRUD(db)
            reset_crud.create_reset_token(user.id, reset_token, expires_at)
            
            # In a real implementation, you would send an email here
            # For now, we'll just log the token for testing
            logger.info(f"Password reset token for {request.email}: {reset_token}")
            
            # TODO: Implement email service to send reset link
            # email_service.send_password_reset_email(user.email, reset_token)
        
        return MessageResponse(message="If an account with that email exists, you will receive a password reset link.")
        
    except Exception as e:
        logger.error(f"Forgot password failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to process password reset request"
        )

@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db_session)
):
    """Reset user password using reset token"""
    try:
        reset_crud = PasswordResetTokenCRUD(db)
        reset_token_record = reset_crud.get_reset_token(request.token)
        
        if not reset_token_record:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )
        
        # Get user and update password
        user_crud = UserCRUD(db)
        user = user_crud.get_user_by_id(reset_token_record.user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User not found"
            )
        
        # Hash new password and update
        hashed_password = hash_password(request.new_password)
        user_crud.update_user_password(user.id, hashed_password)
        
        # Mark reset token as used
        reset_crud.use_reset_token(request.token)
        
        # Revoke all refresh tokens for security
        refresh_crud = RefreshTokenCRUD(db)
        refresh_crud.revoke_all_user_tokens(user.id)
        
        logger.info(f"Password reset successful for user {user.email}")
        
        return MessageResponse(message="Password has been reset successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Password reset failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to reset password"
        )

@router.get("/debug/reset-tokens/{email}")
async def get_reset_tokens_for_email(
    email: str,
    db: Session = Depends(get_db_session)
):
    """Debug endpoint to get reset tokens for an email (remove in production)"""
    try:
        user_crud = UserCRUD(db)
        user = user_crud.get_user_by_email(email)
        
        if not user:
            return {"tokens": []}
        
        reset_crud = PasswordResetTokenCRUD(db)
        # Get all unused tokens for this user
        tokens = db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.is_used == False
        ).all()
        
        return {
            "tokens": [
                {
                    "token": token.token,
                    "expires_at": token.expires_at.isoformat(),
                    "created_at": token.created_at.isoformat()
                }
                for token in tokens
            ]
        }
        
    except Exception as e:
        logger.error(f"Debug reset tokens failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to get reset tokens"
        )