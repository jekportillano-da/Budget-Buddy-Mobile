"""
User management routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db_session, UserCRUD
from auth.routes import get_current_user
from auth.utils import get_tier_features
from .models import UpdateProfileRequest, UserProfileResponse, TierUpdateRequest

router = APIRouter()

@router.get("/profile", response_model=UserProfileResponse)
async def get_user_profile(current_user = Depends(get_current_user)):
    """Get user profile information"""
    tier_info = get_tier_features(current_user.tier)
    
    return UserProfileResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        tier=current_user.tier,
        total_savings=current_user.total_savings,
        email_verified=current_user.email_verified,
        created_at=current_user.created_at,
        last_login=current_user.last_login,
        tier_info=tier_info
    )

@router.put("/profile", response_model=UserProfileResponse)
async def update_user_profile(
    profile_data: UpdateProfileRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Update user profile information"""
    try:
        user_crud = UserCRUD(db)
        
        # Update user information
        current_user.full_name = profile_data.full_name or current_user.full_name
        
        db.commit()
        db.refresh(current_user)
        
        tier_info = get_tier_features(current_user.tier)
        
        return UserProfileResponse(
            id=current_user.id,
            email=current_user.email,
            full_name=current_user.full_name,
            tier=current_user.tier,
            total_savings=current_user.total_savings,
            email_verified=current_user.email_verified,
            created_at=current_user.created_at,
            last_login=current_user.last_login,
            tier_info=tier_info
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Profile update failed"
        )

@router.post("/tier/update")
async def update_user_tier(
    tier_data: TierUpdateRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Update user's tier based on savings amount"""
    try:
        user_crud = UserCRUD(db)
        
        # Calculate tier based on savings
        tier_thresholds = [
            (10000, "Elite Saver"),
            (5000, "Diamond Saver"),
            (2500, "Platinum Saver"),
            (1000, "Gold Saver"),
            (500, "Silver Saver"),
            (100, "Bronze Saver"),
            (0, "Starter")
        ]
        
        new_tier = "Starter"
        for threshold, tier_name in tier_thresholds:
            if tier_data.total_savings >= threshold:
                new_tier = tier_name
                break
        
        # Update user tier and savings
        updated_user = user_crud.update_user_tier(
            current_user.id,
            new_tier,
            tier_data.total_savings
        )
        
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        tier_info = get_tier_features(new_tier)
        
        return {
            "message": "Tier updated successfully",
            "old_tier": current_user.tier,
            "new_tier": new_tier,
            "total_savings": tier_data.total_savings,
            "tier_info": tier_info
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Tier update failed"
        )