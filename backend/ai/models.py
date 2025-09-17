"""
Pydantic models for AI service requests and responses
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

# Request models
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000, description="User's chat message")
    context: Optional[str] = Field(None, description="Additional context for the AI")

class InsightsRequest(BaseModel):
    monthly_income: float = Field(..., gt=0, description="Monthly income in pesos")
    monthly_expenses: float = Field(..., gt=0, description="Monthly expenses in pesos")
    expense_categories: Dict[str, float] = Field(..., description="Breakdown of expenses by category")
    savings_goal: Optional[float] = Field(None, description="Target savings amount")
    time_period: Optional[str] = Field("current_month", description="Analysis time period")

class RecommendationsRequest(BaseModel):
    target_budget: float = Field(..., gt=0, description="Target budget amount in pesos")
    goals: List[str] = Field(..., description="Financial goals")
    timeframe: str = Field(..., description="Timeline for achieving goals")
    current_expenses: Optional[Dict[str, float]] = Field(None, description="Current expense breakdown")

# Response models
class ChatResponse(BaseModel):
    response: str
    tier_info: Dict[str, Any]
    suggestions: List[str] = []
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class InsightsResponse(BaseModel):
    analysis: str
    generated_at: datetime
    tier_unlocked: str
    confidence_score: Optional[float] = None

class RecommendationsResponse(BaseModel):
    recommendations: str
    personalized_for: str
    generated_at: datetime
    priority_actions: Optional[List[str]] = None

class UsageStatsResponse(BaseModel):
    tier: str
    chat_usage_today: int
    chat_limit_daily: int
    insights_usage_month: int
    insights_limit_monthly: int
    available_features: Dict[str, bool]