"""
AI service routes with tier-based access control
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, date
import httpx
import logging
from decouple import config

from database import get_db_session, User, APIUsage
from auth.routes import get_current_user
from auth.utils import check_tier_access, get_tier_features
from .models import (
    ChatRequest,
    ChatResponse,
    InsightsRequest,
    InsightsResponse,
    RecommendationsRequest,
    RecommendationsResponse,
    UsageStatsResponse
)

router = APIRouter()
logger = logging.getLogger(__name__)

# External API configuration
GROK_API_KEY = config("GROK_API_KEY", default="")
GROK_API_URL = config("GROK_API_URL", default="https://api.x.ai/v1")
CLAUDE_API_KEY = config("CLAUDE_API_KEY", default="")
CLAUDE_API_URL = config("CLAUDE_API_URL", default="https://api.anthropic.com/v1")

async def check_usage_limits(
    user: User,
    endpoint: str,
    db: Session
) -> bool:
    """Check if user has exceeded their tier-based usage limits"""
    tier_info = get_tier_features(user.tier)
    limits = tier_info["limits"]
    
    # Unlimited for certain tiers
    if endpoint == "chat" and limits["ai_requests_per_day"] == -1:
        return True
    if endpoint == "insights" and limits["insights_per_month"] == -1:
        return True
    
    # Check daily usage for chat
    if endpoint == "chat":
        today = date.today()
        usage_count = db.query(APIUsage).filter(
            APIUsage.user_id == user.id,
            APIUsage.endpoint == endpoint,
            APIUsage.date >= today
        ).count()
        
        return usage_count < limits["ai_requests_per_day"]
    
    # Check monthly usage for insights
    if endpoint == "insights":
        current_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        usage_count = db.query(APIUsage).filter(
            APIUsage.user_id == user.id,
            APIUsage.endpoint == endpoint,
            APIUsage.date >= current_month
        ).count()
        
        return usage_count < limits["insights_per_month"]
    
    return True

async def record_api_usage(
    user: User,
    endpoint: str,
    db: Session
):
    """Record API usage for tracking and billing"""
    usage = APIUsage(
        user_id=user.id,
        endpoint=endpoint,
        tier_at_usage=user.tier
    )
    db.add(usage)
    db.commit()

async def call_grok_api(prompt: str, model: str = "grok-beta") -> dict:
    """Call Grok AI API with error handling"""
    if not GROK_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Grok AI service not configured"
        )
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{GROK_API_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {GROK_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.7,
                    "max_tokens": 1000
                },
                timeout=30.0
            )
            
            if response.status_code != 200:
                logger.error(f"Grok API error: {response.status_code} - {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="AI service temporarily unavailable"
                )
            
            return response.json()
            
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="AI service timeout"
        )
    except Exception as e:
        logger.error(f"Grok API call failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service error"
        )

@router.post("/chat", response_model=ChatResponse)
async def ai_chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """AI chatbot with tier-based access control"""
    
    # Check tier access (Bronze+ required)
    if not check_tier_access(current_user.tier, "Bronze Saver"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AI chat requires Bronze tier or higher. Save ₱100+ to unlock this feature!"
        )
    
    # Check usage limits
    if not await check_usage_limits(current_user, "chat", db):
        tier_info = get_tier_features(current_user.tier)
        limit = tier_info["limits"]["ai_requests_per_day"]
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Daily AI chat limit reached ({limit} requests). Upgrade to Platinum tier for unlimited access!"
        )
    
    try:
        # Create context-aware prompt
        context_prompt = f"""
You are a helpful Filipino financial advisor AI assistant for Budget Buddy app users.

User Profile:
- Tier: {current_user.tier}
- Total Savings: ₱{current_user.total_savings:,.2f}

User Question: {request.message}

Provide helpful, specific advice tailored to Filipino financial context. Keep responses concise and actionable.
"""
        
        # Call Grok AI
        ai_response = await call_grok_api(context_prompt)
        response_text = ai_response["choices"][0]["message"]["content"]
        
        # Record usage
        await record_api_usage(current_user, "chat", db)
        
        # Check if this unlocks any tier benefits
        tier_info = get_tier_features(current_user.tier)
        suggestions = []
        
        if current_user.tier == "Bronze Saver":
            suggestions.append("💡 Reach Gold tier (₱1,000+ savings) to unlock advanced financial insights!")
        elif current_user.tier == "Silver Saver":
            suggestions.append("🎯 Upgrade to Gold tier for unlimited AI recommendations and data export!")
        
        return ChatResponse(
            response=response_text,
            tier_info=tier_info,
            suggestions=suggestions
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AI chat failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI chat service error"
        )

@router.post("/insights", response_model=InsightsResponse)
async def ai_insights(
    request: InsightsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Advanced AI insights - Gold tier and above"""
    
    # Check tier access (Gold+ required)
    if not check_tier_access(current_user.tier, "Gold Saver"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Advanced AI insights require Gold tier or higher. Save ₱1,000+ to unlock this premium feature!"
        )
    
    # Check usage limits
    if not await check_usage_limits(current_user, "insights", db):
        tier_info = get_tier_features(current_user.tier)
        limit = tier_info["limits"]["insights_per_month"]
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Monthly insights limit reached ({limit} insights). Upgrade to Platinum tier for unlimited access!"
        )
    
    try:
        # Create detailed analysis prompt
        analysis_prompt = f"""
As an expert Filipino financial advisor AI, analyze this user's financial data and provide comprehensive insights:

User Profile:
- Tier: {current_user.tier}
- Total Savings: ₱{current_user.total_savings:,.2f}
- Monthly Income: ₱{request.monthly_income:,.2f}
- Monthly Expenses: ₱{request.monthly_expenses:,.2f}
- Expense Categories: {request.expense_categories}

Provide a detailed financial analysis in JSON format with:
1. Financial health score (0-100)
2. Key strengths and areas for improvement
3. Specific actionable recommendations
4. Philippines-specific context (inflation, cost of living, etc.)
5. Savings optimization strategies
6. Investment suggestions appropriate for the Philippines market

Format as structured JSON with clear sections and Filipino peso amounts.
"""
        
        # Call Grok AI for detailed analysis
        ai_response = await call_grok_api(analysis_prompt, model="grok-beta")
        response_text = ai_response["choices"][0]["message"]["content"]
        
        # Record usage
        await record_api_usage(current_user, "insights", db)
        
        return InsightsResponse(
            analysis=response_text,
            generated_at=datetime.utcnow(),
            tier_unlocked=current_user.tier
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AI insights failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI insights service error"
        )

@router.post("/recommendations", response_model=RecommendationsResponse)
async def ai_recommendations(
    request: RecommendationsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """AI-powered budget recommendations - Silver tier and above"""
    
    # Check tier access (Silver+ required)
    if not check_tier_access(current_user.tier, "Silver Saver"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AI recommendations require Silver tier or higher. Save ₱500+ to unlock this feature!"
        )
    
    try:
        # Create recommendation prompt
        rec_prompt = f"""
Generate personalized budget recommendations for this Filipino Budget Buddy user:

Current Situation:
- Tier: {current_user.tier}
- Total Savings: ₱{current_user.total_savings:,.2f}
- Target Budget: ₱{request.target_budget:,.2f}
- Goals: {request.goals}
- Time Frame: {request.timeframe}

Provide 5-7 specific, actionable recommendations optimized for the Philippines context.
Include peso amounts and realistic timelines.
"""
        
        # Call Grok AI
        ai_response = await call_grok_api(rec_prompt)
        recommendations_text = ai_response["choices"][0]["message"]["content"]
        
        return RecommendationsResponse(
            recommendations=recommendations_text,
            personalized_for=current_user.tier,
            generated_at=datetime.utcnow()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AI recommendations failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI recommendations service error"
        )

@router.get("/usage", response_model=UsageStatsResponse)
async def get_usage_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Get user's AI usage statistics"""
    
    tier_info = get_tier_features(current_user.tier)
    
    # Get today's chat usage
    today = date.today()
    chat_usage_today = db.query(APIUsage).filter(
        APIUsage.user_id == current_user.id,
        APIUsage.endpoint == "chat",
        APIUsage.date >= today
    ).count()
    
    # Get this month's insights usage
    current_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    insights_usage_month = db.query(APIUsage).filter(
        APIUsage.user_id == current_user.id,
        APIUsage.endpoint == "insights",
        APIUsage.date >= current_month
    ).count()
    
    return UsageStatsResponse(
        tier=current_user.tier,
        chat_usage_today=chat_usage_today,
        chat_limit_daily=tier_info["limits"]["ai_requests_per_day"],
        insights_usage_month=insights_usage_month,
        insights_limit_monthly=tier_info["limits"]["insights_per_month"],
        available_features=tier_info["features"]
    )