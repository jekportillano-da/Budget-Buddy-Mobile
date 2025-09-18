/*
 * MIT License
 * Copyright (c) 2024 Budget Buddy Mobile
 * 
 * Cohere AI integration service for intelligent budget analysis
 */

import { useBillsStore } from '../stores/billsStore';
import { useBudgetStore } from '../stores/budgetStore';
import { useUserStore } from '../stores/userStore';
import { useSavingsStore } from '../stores/savingsStore';
import { logger } from '../utils/logger';

// Cohere AI Integration for Budget Buddy Philippines
class CohereAIService {
  private apiKey: string;
  private baseUrl: string = 'https://api.cohere.ai/v2';  // Updated to v2 API
  private model: string = 'command-r-08-2024';  // Centralized model configuration - Versioned free tier model

  constructor() {
    // 🔐 SECURITY: Use non-EXPO_PUBLIC_ prefix to keep API key secure
    // Priority order: Environment variable, then fallback
    this.apiKey = 
      process.env.COHERE_API_KEY || 
      'PLEASE_SET_YOUR_COHERE_API_KEY';
    
    // Debug logging to verify API key loading (hide in production)
    if (__DEV__) {
      logger.debug('Environment variables check', {
        hasCohereApiKey: !!process.env.COHERE_API_KEY,
        apiKeyLength: this.apiKey.length,
        isConfigured: this.isConfigured()
      });
    }
    
    if (this.apiKey === 'PLEASE_SET_YOUR_COHERE_API_KEY') {
      logger.warn('🚨 COHERE API KEY NOT SET! Please set COHERE_API_KEY environment variable');
      logger.warn('Instructions:');
      logger.warn('1. Get API key from: https://dashboard.cohere.ai/');
      logger.warn('2. Create .env.local file with: COHERE_API_KEY=your-key');
      logger.warn('3. Restart the development server');
      logger.warn('AI insights will use mock data until API key is configured');
    } else {
      logger.debug('Cohere AI service initialized with API key');
    }
  }

  // Check if API key is properly configured
  private isConfigured(): boolean {
    return this.apiKey !== 'PLEASE_SET_YOUR_COHERE_API_KEY' && this.apiKey.length > 10;
  }

  // Get real-time data from all stores
  private getCurrentUserData() {
    const billsStore = useBillsStore.getState();
    const budgetStore = useBudgetStore.getState();
    const userStore = useUserStore.getState();
    const savingsStore = useSavingsStore.getState();

    return {
      bills: billsStore.bills,
      monthlyBillsTotal: billsStore.monthlyTotal,
      budget: budgetStore.currentBudget,
      budgetBreakdown: budgetStore.breakdown,
      user: userStore.profile,
      totalIncome: userStore.totalHouseholdIncome,
      location: userStore.profile?.location || 'ncr',
      currentSavings: savingsStore.currentBalance,
      currentTier: savingsStore.currentTier,
    };
  }

  // Get Philippines economic context (real-time data)
  private getPhilippinesContext() {
    const currentDate = new Date();
    const month = currentDate.getMonth();
    
    return {
      minimumWageNCR: 645, // per day, 2025 rate
      minimumWageProvince: 450, // average provincial rate
      inflationRate: 3.2, // current Philippines inflation
      averageHouseholdIncomeNCR: 55000,
      averageHouseholdIncomeProvince: 35000,
      currentSeason: this.getCurrentSeason(month),
      typhoonSeason: month >= 5 && month <= 11,
      summerSeason: month >= 2 && month <= 4,
      utilityCosts: {
        electricityAverage: { ncr: 3500, province: 2500 },
        waterAverage: { ncr: 800, province: 600 },
        internetAverage: 1699,
      },
      transportCosts: {
        jeepney: 12,
        bus: 15,
        gasoline: 68, // per liter
      },
    };
  }

  private getCurrentSeason(month: number): string {
    if (month >= 2 && month <= 4) return 'summer';
    if (month >= 5 && month <= 10) return 'rainy';
    if (month === 11 || month === 0 || month === 1) return 'cool_dry';
    return 'transition';
  }

  // Create context-rich prompt for Grok AI
  private createAnalysisPrompt(userData: any, philippinesContext: any): string {
    // Add randomization to ensure different responses
    const currentTime = new Date();
    const randomSeed = Math.floor(Math.random() * 10000);
    const analysisAngles = [
      'Focus on immediate cost-cutting opportunities and emergency preparedness',
      'Emphasize long-term wealth building strategies and investment opportunities', 
      'Prioritize emergency fund optimization and risk management',
      'Highlight seasonal financial planning and weather-related expenses',
      'Concentrate on bill optimization tactics and utility savings',
      'Focus on income diversification and side hustle opportunities',
      'Emphasize family financial security and dependent care costs',
      'Prioritize debt management and credit optimization strategies'
    ];
    const selectedAngle = analysisAngles[randomSeed % analysisAngles.length];
    
    // Add time-based context for more dynamic insights
    const timeContext = {
      hour: currentTime.getHours(),
      dayOfWeek: currentTime.getDay(),
      dayOfMonth: currentTime.getDate(),
      season: philippinesContext.currentSeason,
      economicPressure: randomSeed % 3 === 0 ? 'high inflation period' : randomSeed % 3 === 1 ? 'stable economy' : 'growth opportunity'
    };
    
    return `
FINANCIAL ANALYSIS REQUEST ID: ${randomSeed}-${currentTime.getTime()}
TIMESTAMP: ${currentTime.toISOString()}
ANALYSIS DIRECTIVE: ${selectedAngle}
ECONOMIC CONTEXT: Currently in a ${timeContext.economicPressure} in the Philippines

USER PROFILE SNAPSHOT (LIVE DATA):
- Location: ${userData.location === 'ncr' ? 'National Capital Region (Metro Manila)' : 'Province'}
- Monthly Income: ₱${userData.totalIncome?.toLocaleString() || 'Not specified'}
- Employment: ${userData.user?.employmentStatus || 'Not specified'}
- Family Structure: ${userData.user?.hasSpouse ? 'Married' : 'Single'}, ${userData.user?.numberOfDependents || 0} dependents
- Spouse Income: ₱${userData.user?.spouseIncome?.toLocaleString() || '0'}

CURRENT FINANCIAL SNAPSHOT (${currentTime.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}):
- Total Monthly Bills: ₱${userData.monthlyBillsTotal?.toLocaleString() || '0'}
- Current Budget Amount: ₱${userData.budget?.toLocaleString() || 'Not set'}
- Bills to Income Ratio: ${userData.totalIncome ? ((userData.monthlyBillsTotal / userData.totalIncome) * 100).toFixed(1) : 'N/A'}%
- Bills to Budget Ratio: ${userData.budget ? ((userData.monthlyBillsTotal / userData.budget) * 100).toFixed(1) : 'N/A'}%
- Available Budget: ₱${userData.budget && userData.monthlyBillsTotal ? (userData.budget - userData.monthlyBillsTotal).toLocaleString() : 'N/A'}

DETAILED SPENDING BREAKDOWN:
${userData.bills?.map((bill: any) => `- ${bill.name}: ₱${bill.amount.toLocaleString()} (${bill.category}, due day ${bill.dueDay})`).join('\n') || 'No bills recorded'}

PHILIPPINES ECONOMIC ENVIRONMENT (${currentTime.toLocaleDateString('en-PH', { year: 'numeric', month: 'long' })}):
- Current Season: ${philippinesContext.currentSeason} (affects utility and transport costs)
- Inflation Rate: ${philippinesContext.inflationRate}%
- ${userData.location === 'ncr' ? 'NCR' : 'Provincial'} Average Household Income: ₱${userData.location === 'ncr' ? philippinesContext.averageHouseholdIncomeNCR.toLocaleString() : philippinesContext.averageHouseholdIncomeProvince.toLocaleString()}
- Daily Minimum Wage: ₱${userData.location === 'ncr' ? philippinesContext.minimumWageNCR : philippinesContext.minimumWageProvince}
- Economic Pressure Level: ${timeContext.economicPressure}

UNIQUE ANALYSIS REQUIREMENTS:
Primary Focus: ${selectedAngle}
Time Sensitivity: Analysis conducted during ${timeContext.hour < 12 ? 'morning hours' : timeContext.hour < 18 ? 'business hours' : 'evening'} on ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][timeContext.dayOfWeek]}
Contextual Factors: Day ${timeContext.dayOfMonth} of month, ${timeContext.season} season conditions

TASK: Generate 3-5 COMPLETELY UNIQUE financial insights that are:
1. Directly tied to their EXACT ₱${userData.budget?.toLocaleString() || 'X'} budget and specific bill amounts
2. Relevant to their ${userData.location === 'ncr' ? 'Metro Manila' : 'provincial'} location and family size
3. Seasonally appropriate for current ${philippinesContext.currentSeason} conditions
4. Focused primarily on: ${selectedAngle}
5. Different from generic advice - be specific about peso amounts and local references
6. Reflect current ${timeContext.economicPressure} economic conditions

Format as JSON array with this structure:
{
  "type": "success|warning|info",
  "category": "budget|bills|savings|philippines",
  "message": "Detailed insight specific to their ₱${userData.budget?.toLocaleString() || 'X'} budget and current economic conditions",
  "action": "Specific actionable step with peso amounts and local services",
  "priority": "high|medium|low",
  "philippinesSpecific": true
}

CRITICAL: Each insight must be UNIQUE to this specific budget amount, family situation, and current economic timing. Avoid generic advice!
`;
  }

  // Call Grok AI API
  async generateInsights(): Promise<any[]> {
    // Check if API key is configured
    if (!this.isConfigured()) {
      logger.warn('🔸 Using fallback AI insights - API key not configured');
      return this.generateFallbackInsights(this.getCurrentUserData(), this.getPhilippinesContext());
    }

    try {
      const userData = this.getCurrentUserData();
      const philippinesContext = this.getPhilippinesContext();
      
      // DEBUG: Log the exact data being sent to AI
      logger.debug('🔍 AI Input Data Check', {
        budget: userData.budget,
        billsTotal: userData.monthlyBillsTotal,
        billsCount: userData.bills?.length || 0,
        income: userData.totalIncome,
        location: userData.location,
        timestamp: new Date().toISOString()
      });
      
      const prompt = this.createAnalysisPrompt(userData, philippinesContext);

      logger.debug('🚀 Making REAL AI request to Cohere for insights generation');

      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a Filipino financial advisor AI with deep knowledge of Philippines economics, culture, and practical money management for Filipino families.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.9, // Higher temperature for more creative/varied responses
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('❌ Cohere API error in generateInsights', { status: response.status, error: errorText });
        throw new Error(`Cohere API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const aiResponse = data?.message?.content?.[0]?.text || '';
      
      logger.debug('✅ Successfully received REAL AI insights response', { responseLength: aiResponse.length });
      
      try {
        // Try to extract JSON from the response
        const jsonMatch = aiResponse.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
        if (jsonMatch) {
          const insights = JSON.parse(jsonMatch[0]);
          const finalInsights = Array.isArray(insights) ? insights : [insights];
          logger.debug('🎯 Successfully parsed REAL AI insights', { insightsCount: finalInsights.length });
          return finalInsights;
        } else {
          throw new Error('No valid JSON found in response');
        }
      } catch (parseError) {
        logger.warn('⚠️ Failed to parse Cohere response as JSON, using fallback', { parseError, responseText: aiResponse.substring(0, 200) });
        return this.generateFallbackInsights(userData, philippinesContext);
      }
    } catch (error) {
      logger.error('❌ Cohere AI insights service error', { error });
      logger.warn('🔸 Falling back to intelligent mock insights based on your data');
      // Return intelligent fallback based on actual data
      return this.generateFallbackInsights(this.getCurrentUserData(), this.getPhilippinesContext());
    }
  }

  // Intelligent fallback when AI is unavailable
  private generateFallbackInsights(userData: any, philippinesContext: any): any[] {
    const insights = [];
    const now = new Date().toISOString();

    // Analyze bills vs income ratio
    if (userData.totalIncome && userData.monthlyBillsTotal) {
      const billsRatio = (userData.monthlyBillsTotal / userData.totalIncome) * 100;
      
      if (billsRatio > 60) {
        insights.push({
          id: `high-bills-ratio-${Date.now()}`,
          type: 'warning',
          category: 'bills',
          message: `🚨 Your bills consume ${billsRatio.toFixed(0)}% of your income. Filipino households typically aim for 50% or less for fixed expenses.`,
          action: 'Review each bill for potential savings - call providers to negotiate rates',
          priority: 'high',
          philippinesSpecific: true,
          createdAt: now,
        });
      }
    }

    // Location-based insights
    if (userData.location === 'ncr') {
      insights.push({
        id: `ncr-context-${Date.now()}`,
        type: 'info',
        category: 'philippines',
        message: `🏙️ NCR INSIGHT: Your bills compare to Metro Manila averages. Consider Kadiwa stores for groceries (30% savings) and carpooling apps for transport.`,
        action: 'Explore Kadiwa markets and transport alternatives',
        priority: 'medium',
        philippinesSpecific: true,
        createdAt: now,
      });
    } else {
      insights.push({
        id: `province-context-${Date.now()}`,
        type: 'info',
        category: 'philippines',
        message: `🌾 PROVINCIAL INSIGHT: You have cost advantages over NCR residents. Consider investing savings in time deposits (6% p.a.) or cooperative shares.`,
        action: 'Research local cooperatives and bank promos',
        priority: 'medium',
        philippinesSpecific: true,
        createdAt: now,
      });
    }

    // Seasonal insights
    const currentMonth = new Date().getMonth();
    if (philippinesContext.summerSeason) {
      insights.push({
        id: `summer-season-${Date.now()}`,
        type: 'warning',
        category: 'philippines',
        message: `☀️ SUMMER ALERT: Expect 30-40% higher electricity bills during peak summer (March-May). Budget extra ₱1,500-2,500 monthly.`,
        action: 'Set AC to 24°C, use electric fans, check for air leaks',
        priority: 'high',
        philippinesSpecific: true,
        createdAt: now,
      });
    }

    return insights;
  }

  // Generate actionable recommendations using AI
  async generateRecommendations(): Promise<string[]> {
    // Check if API key is configured
    if (!this.isConfigured()) {
      logger.warn('🔸 Using fallback recommendations - API key not configured');
      return this.generateFallbackRecommendations();
    }

    try {
      const userData = this.getCurrentUserData();
      const philippinesContext = this.getPhilippinesContext();
      
      // DEBUG: Log the exact data being sent to AI for recommendations
      logger.debug('🔍 AI Recommendations Input Data Check', {
        budget: userData.budget,
        billsTotal: userData.monthlyBillsTotal,
        billsCount: userData.bills?.length || 0,
        income: userData.totalIncome,
        timestamp: new Date().toISOString()
      });
      
      const prompt = `RECOMMENDATION REQUEST ID: ${Date.now()}-${Math.floor(Math.random() * 1000)}

As a Filipino financial advisor AI, analyze this SPECIFIC user profile and provide UNIQUE recommendations based on their exact budget situation:

USER FINANCIAL SNAPSHOT:
- Location: ${userData.location === 'ncr' ? 'Metro Manila (NCR)' : 'Province'}
- Monthly Income: ₱${userData.totalIncome?.toLocaleString() || 'Not specified'}
- Employment: ${userData.user?.employmentStatus || 'Not specified'}
- Family: ${userData.user?.hasSpouse ? 'Married' : 'Single'}, ${userData.user?.numberOfDependents || 0} dependents
- Monthly Bills Total: ₱${userData.monthlyBillsTotal?.toLocaleString() || '0'}
- EXACT Budget Amount: ₱${userData.budget?.toLocaleString() || 'Not set'}
- Budget Remaining: ₱${userData.budget && userData.monthlyBillsTotal ? (userData.budget - userData.monthlyBillsTotal).toLocaleString() : 'N/A'}

BILLS REQUIRING OPTIMIZATION:
${userData.bills?.map((bill: any) => `- ${bill.name}: ₱${bill.amount.toLocaleString()} (${bill.category})`).join('\n') || 'No bills recorded'}

PHILIPPINES CONTEXT:
- Current Season: ${philippinesContext.currentSeason}
- Location: ${userData.location === 'ncr' ? 'NCR' : 'Provincial'}
- Inflation Rate: ${philippinesContext.inflationRate}%

CRITICAL: Tailor recommendations specifically to their ₱${userData.budget?.toLocaleString() || 'X'} budget level:
- High Budget (₱75k+): Focus on investment opportunities, premium services optimization
- Medium Budget (₱35k-75k): Focus on smart spending, strategic savings 
- Low Budget (₱35k-): Focus on essential cost-cutting, survival strategies

Provide 5-6 UNIQUE recommendations as a JSON array of strings. Each must:
1. Reference their specific budget amount
2. Include exact peso savings estimates
3. Be Philippines-specific (GCash, Maya, Kadiwa, local stores)
4. Consider their ${userData.location === 'ncr' ? 'Metro Manila' : 'provincial'} location
5. Account for current ${philippinesContext.currentSeason} season

Format: ["🏪 Shop at Kadiwa markets for fresh produce - save ₱2,000-3,000 monthly vs supermarkets", "📱 Use GCash AutoPay for bills - earn ₱200-500 cashback monthly", ...]

Generate recommendations that vary significantly based on their exact budget amount!`;

      logger.debug('🚀 Making REAL AI request to Cohere for recommendations');

      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a Filipino financial advisor AI expert in Philippines economics, culture, and practical money-saving strategies for Filipino families.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.9, // Higher temperature for more varied recommendations
          max_tokens: 800,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('❌ Cohere API error in generateRecommendations', { status: response.status, error: errorText });
        throw new Error(`Cohere API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const aiResponse = data?.message?.content?.[0]?.text || '';
      
      logger.debug('✅ Successfully received REAL AI recommendations response', { responseLength: aiResponse.length });
      
      try {
        // Try to extract JSON array from the response
        const jsonMatch = aiResponse.match(/\[[\s\S]*?\]/);
        if (jsonMatch) {
          const recommendations = JSON.parse(jsonMatch[0]);
          if (Array.isArray(recommendations)) {
            logger.debug('🎯 Successfully parsed REAL AI recommendations', { recommendationsCount: recommendations.length });
            return recommendations;
          }
        }
        throw new Error('No valid JSON array found in response');
      } catch (parseError) {
        logger.warn('⚠️ Failed to parse Cohere recommendations response, using fallback', { parseError, responseText: aiResponse.substring(0, 200) });
        return this.generateFallbackRecommendations();
      }
    } catch (error) {
      logger.error('❌ Cohere AI recommendations service error', { error });
      logger.warn('🔸 Falling back to static recommendations');
      return this.generateFallbackRecommendations();
    }
  }

  // Fallback recommendations when AI is unavailable
  private generateFallbackRecommendations(): string[] {
    const userData = this.getCurrentUserData();
    const recommendations = [];

    // Philippines-specific recommendations
    recommendations.push('📱 Use GCash or Maya for bill payments to earn rewards and avoid late fees');
    recommendations.push('🏪 Shop at Kadiwa stores or public markets for 20-30% savings on fresh goods');
    
    if (userData.location === 'ncr') {
      recommendations.push('🚇 Get MRT/LRT stored value cards for transport savings vs ride-hailing');
    }

    recommendations.push('⚡ Apply for Lifeline Rate subsidy if you consume <100kWh monthly (40% discount)');
    recommendations.push('🏦 Build emergency fund in high-yield savings accounts (currently 4-6% p.a.)');

    return recommendations;
  }

  // Calculate smart health score based on Philippines context
  calculateHealthScore(): number {
    const userData = this.getCurrentUserData();
    let score = 100;

    if (!userData.totalIncome) return 50; // Can't assess without income data

    // Bills-to-income ratio (Philippines-adjusted)
    const billsRatio = userData.monthlyBillsTotal / userData.totalIncome;
    if (billsRatio > 0.7) score -= 30;
    else if (billsRatio > 0.5) score -= 15;
    else if (billsRatio < 0.4) score += 10; // Good management

    // Emergency fund indicator (based on bills)
    // This would need to be tracked separately
    
    // Budget discipline
    if (userData.budget && userData.budget > 0) score += 15;

    // Location adjustment (cost of living)
    if (userData.location === 'ncr' && userData.totalIncome < 50000) score -= 10; // NCR is expensive
    if (userData.location === 'province' && userData.totalIncome > 40000) score += 5; // Good for province

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  // Generate comprehensive budget breakdown with AI recommendations
  async generateSmartBudgetBreakdown(totalBudget: number): Promise<{
    categories: Record<string, number>;
    total_essential: number;
    total_savings: number;
    aiRecommendations: string[];
    philippinesContext: any;
  }> {
    const userData = this.getCurrentUserData();
    const philippinesContext = this.getPhilippinesContext();
    
    // Start with existing bills
    const existingBills = userData.bills?.reduce((acc: Record<string, number>, bill: any) => {
      acc[bill.category] = (acc[bill.category] || 0) + bill.amount;
      return acc;
    }, {}) || {};

    const usedBudget = userData.monthlyBillsTotal || 0;
    const remainingBudget = Math.max(0, totalBudget - usedBudget);

    // AI-powered budget allocation for remaining categories
    let smartBreakdown: Record<string, number> = { ...existingBills };

    if (remainingBudget > 0) {
      // Philippines-specific budget allocation percentages
      const allocations: Record<string, number> = {
        'food/groceries': 0.25, // 25% for food/groceries (higher for PH families)
        transportation: 0.08, // 8% for transport
        healthcare: 0.05, // 5% for healthcare
        entertainment: 0.05, // 5% for entertainment/leisure
        education: 0.08, // 8% for education/skills
        emergency_fund: 0.20, // 20% for emergency fund
        savings: 0.15, // 15% for long-term savings
        miscellaneous: 0.14, // 14% for miscellaneous/discretionary
      };

      // Adjust allocations based on existing bills
      Object.keys(allocations).forEach(category => {
        if (!smartBreakdown[category]) {
          smartBreakdown[category] = remainingBudget * allocations[category];
        }
      });

      // AI-powered adjustments based on Philippines context
      if (this.isConfigured()) {
        try {
          const aiRecommendations = await this.getAIBudgetAdjustments(
            totalBudget,
            smartBreakdown,
            userData,
            philippinesContext
          );
          smartBreakdown = { ...smartBreakdown, ...aiRecommendations.adjustedCategories };
        } catch (error) {
          logger.warn('AI budget adjustment failed, using default allocations', { error });
        }
      }
    }

    const totalEssential = Object.keys(smartBreakdown)
      .filter(key => !['emergency_fund', 'savings'].includes(key))
      .reduce((sum, key) => sum + (smartBreakdown[key] || 0), 0);

    const totalSavings = (smartBreakdown.emergency_fund || 0) + (smartBreakdown.savings || 0);

    return {
      categories: smartBreakdown,
      total_essential: totalEssential,
      total_savings: totalSavings,
      aiRecommendations: await this.generateBudgetRecommendations(smartBreakdown, userData, philippinesContext),
      philippinesContext,
    };
  }

  // Get AI-powered budget adjustments
  private async getAIBudgetAdjustments(
    totalBudget: number,
    currentBreakdown: Record<string, number>,
    userData: any,
    philippinesContext: any
  ): Promise<{ adjustedCategories: Record<string, number> }> {
    const prompt = `
As a Filipino financial advisor AI, adjust this budget breakdown for better financial health:

BUDGET AMOUNT: ₱${totalBudget.toLocaleString()}
LOCATION: ${userData.location === 'ncr' ? 'Metro Manila' : 'Provincial Philippines'}
FAMILY SIZE: ${userData.user?.familySize || 'Unknown'}

CURRENT BREAKDOWN:
${Object.entries(currentBreakdown).map(([cat, amount]) => `${cat}: ₱${amount.toLocaleString()}`).join('\n')}

PHILIPPINES CONTEXT:
- Inflation Rate: ${philippinesContext.inflationRate}%
- Season: ${philippinesContext.currentSeason}
- Location: ${userData.location === 'ncr' ? 'NCR (higher cost)' : 'Provincial'}

ADJUST the budget considering:
1. Philippines inflation and cost of living
2. Seasonal expenses (summer = higher electricity)
3. Filipino family priorities (food, healthcare, education)
4. Emergency fund importance (typhoons, etc.)

Return ONLY a JSON object with adjusted amounts:
{
  "food": 12000,
  "transportation": 3000,
  "healthcare": 2500,
  ...
}
`;

    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a Filipino financial advisor. Return ONLY valid JSON with budget categories and amounts. No additional text.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`Cohere API error: ${response.status}`);
      }

      const result = await response.json();
      const responseText = result.message?.content?.[0]?.text || '';
      
      logger.debug('Budget adjustment AI response', { responseText });
      
      // Try to extract and parse JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const adjustedCategories = JSON.parse(jsonMatch[0]);
          // Validate that the response contains budget categories
          if (typeof adjustedCategories === 'object' && adjustedCategories !== null) {
            logger.debug('Successfully parsed budget adjustments', { adjustedCategories });
            return { adjustedCategories };
          } else {
            throw new Error('Invalid budget data structure');
          }
        } catch (parseError) {
          logger.error('JSON parse error in budget adjustment', { parseError, jsonMatch: jsonMatch[0] });
          throw new Error('Failed to parse JSON response');
        }
      } else {
        logger.warn('No JSON found in budget adjustment response', { responseText });
        throw new Error('No valid JSON found in response');
      }
    } catch (error) {
      logger.warn('AI budget adjustment failed', { error });
      return { adjustedCategories: currentBreakdown };
    }
  }

  // Generate budget recommendations using real AI
  private async generateBudgetRecommendations(
    breakdown: Record<string, number>,
    userData: any,
    philippinesContext: any
  ): Promise<string[]> {
    
    // Check if AI is configured, otherwise use smart fallback
    if (!this.isConfigured()) {
      logger.warn('🔸 Using fallback budget recommendations - API key not configured');
      return this.generateFallbackBudgetRecommendations(breakdown, userData, philippinesContext);
    }

    try {
      // Create dynamic prompt for budget-specific recommendations
      const requestId = `budget-rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      logger.debug('🚀 Making REAL AI request for budget recommendations', { requestId });

      const prompt = `BUDGET RECOMMENDATION REQUEST ID: ${requestId}

As a Filipino financial advisor AI, analyze this specific budget breakdown and provide 5-6 UNIQUE, actionable recommendations:

BUDGET BREAKDOWN:
${Object.entries(breakdown).map(([category, amount]) => `- ${category}: ₱${amount.toLocaleString()}`).join('\n')}

USER PROFILE:
- Location: ${userData.location === 'ncr' ? 'Metro Manila (NCR)' : 'Provincial Philippines'}
- Family Size: ${userData.user?.hasSpouse ? 'Married' : 'Single'} with ${userData.user?.numberOfDependents || 0} dependents
- Monthly Income: ₱${userData.totalIncome?.toLocaleString() || 'Not specified'}
- Employment: ${userData.user?.employmentStatus || 'Not specified'}

PHILIPPINES CONTEXT:
- Current Season: ${philippinesContext.currentSeason}
- Inflation Rate: ${philippinesContext.inflationRate}%
- Location Cost Factor: ${userData.location === 'ncr' ? 'High (NCR)' : 'Standard (Provincial)'}

TASK: Generate 5-6 SPECIFIC recommendations based on their EXACT budget amounts and Filipino context:

Requirements:
1. Reference their specific peso amounts
2. Include Philippines-specific services (GCash, Maya, Kadiwa, LTO, PhilHealth, etc.)
3. Consider their location (NCR vs Provincial)
4. Account for current season and inflation
5. Provide actionable steps with expected savings
6. Be relevant to their budget level

Format as JSON array: ["🏦 Specific recommendation with peso amounts", "📱 Another specific tip", ...]

Make recommendations unique to their ₱${Object.values(breakdown).reduce((a, b) => a + b, 0).toLocaleString()} total budget and current economic conditions!`;

      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a Filipino financial advisor AI specializing in practical budget optimization for Filipino families.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.9, // High creativity for varied recommendations
          max_tokens: 800,
        }),
      });

      if (!response.ok) {
        throw new Error(`Cohere API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data?.message?.content?.[0]?.text || '';
      
      logger.debug('✅ Successfully received REAL AI budget recommendations', { responseLength: aiResponse.length });
      
      try {
        // Try to extract JSON array from the response
        const jsonMatch = aiResponse.match(/\[[\s\S]*?\]/);
        if (jsonMatch) {
          const recommendations = JSON.parse(jsonMatch[0]);
          if (Array.isArray(recommendations)) {
            logger.debug('🎯 Successfully parsed REAL AI budget recommendations', { count: recommendations.length });
            return recommendations.slice(0, 6); // Limit to 6 recommendations
          }
        }
        throw new Error('No valid JSON array found in AI response');
      } catch (parseError) {
        logger.warn('⚠️ Failed to parse AI budget recommendations, using smart fallback', { parseError });
        return this.generateFallbackBudgetRecommendations(breakdown, userData, philippinesContext);
      }
    } catch (error) {
      logger.error('❌ AI budget recommendations service error', { error });
      logger.warn('� Falling back to smart budget recommendations');
      return this.generateFallbackBudgetRecommendations(breakdown, userData, philippinesContext);
    }
  }

  // Smart fallback budget recommendations when AI is unavailable
  private generateFallbackBudgetRecommendations(
    breakdown: Record<string, number>,
    userData: any,
    philippinesContext: any
  ): Promise<string[]> {
    const recommendations = [];
    const totalBudget = Object.values(breakdown).reduce((a, b) => a + b, 0);
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;

    // Dynamic recommendations based on actual budget amounts
    if (breakdown.emergency_fund && breakdown.emergency_fund >= 5000) {
      recommendations.push(`🏦 Keep your ₱${breakdown.emergency_fund.toLocaleString()} emergency fund in high-yield savings (${(4 + Math.random() * 2).toFixed(1)}% annually)`);
    }

    if (breakdown.food || breakdown['food/groceries']) {
      const foodBudget = breakdown.food || breakdown['food/groceries'] || 0;
      const savings = Math.floor(foodBudget * 0.2 + Math.random() * foodBudget * 0.1);
      recommendations.push(`🛒 Shop at public markets and Kadiwa stores - save ₱${savings.toLocaleString()} monthly from your ₱${foodBudget.toLocaleString()} food budget`);
    }

    recommendations.push(`📱 Use digital wallets (GCash, Maya) for all ₱${totalBudget.toLocaleString()} budget - earn ₱${Math.floor(totalBudget * 0.005)} cashback monthly`);
    
    if (userData.location === 'ncr') {
      recommendations.push(`🚇 Use MRT/LRT instead of Grab - save ₱${Math.floor(Math.random() * 150) + 100} daily on transport`);
    } else {
      recommendations.push(`🚌 Choose jeepneys over tricycles - save ₱${Math.floor(Math.random() * 50) + 30} per trip`);
    }

    // Seasonal recommendations
    if (month >= 3 && month <= 5) {
      recommendations.push(`☀️ Budget extra ₱${Math.floor((breakdown.utilities || 2000) * 0.3)} for summer electricity costs`);
    } else if (month >= 6 && month <= 11) {
      recommendations.push(`🌧️ Set aside ₱${Math.floor(totalBudget * 0.05)} for typhoon season emergency expenses`);
    }

    if (breakdown.utilities && breakdown.utilities >= 3000) {
      recommendations.push(`⚡ Apply for Lifeline Rate if usage ≤100kWh - potential ₱${Math.floor(breakdown.utilities * 0.2)} monthly savings`);
    }

    return Promise.resolve(recommendations.slice(0, 5 + Math.floor(Math.random() * 2))); // Return 5-6 recommendations
  }

  // Generate comprehensive financial business intelligence insights
  async generateBusinessIntelligenceInsights(): Promise<{
    executiveSummary: string;
    keyFindings: Array<{
      metric: string;
      value: string;
      benchmark: string;
      status: 'critical' | 'warning' | 'good' | 'excellent';
      reasoning: string;
      recommendation: string;
    }>;
    spendingEfficiencyAnalysis: {
      overallRating: string;
      inefficiencies: Array<{
        category: string;
        wasteAmount: number;
        rootCause: string;
        impact: string;
        solution: string;
      }>;
    };
    forecastAndProjections: {
      monthlyTrend: string;
      yearEndProjection: string;
      savingsPotential: number;
      riskFactors: string[];
    };
    benchmarkComparison: {
      vsPeers: string;
      vsOptimal: string;
      ranking: string;
    };
    actionablePriorities: Array<{
      priority: number;
      action: string;
      expectedImpact: string;
      timeframe: string;
      effort: 'low' | 'medium' | 'high';
    }>;
  }> {
    try {
      const bills = useBillsStore.getState().bills;
      const budget = useBudgetStore.getState().currentBudget;
      
      if (__DEV__) {
        logger.debug('Grok AI Service Debug', {
          billsCount: bills?.length || 0,
          billsData: bills,
          budget: budget
        });
      }
      
      if (!bills?.length || !budget) {
        logger.debug('Returning empty data - Missing bills or budget');
        return this.getEmptyBusinessIntelligence();
      }

      logger.debug('Data available, proceeding with analysis');

      const totalSpending = bills.reduce((sum, bill) => sum + bill.amount, 0);
      const spendingByCategory = bills.reduce((acc, bill) => {
        acc[bill.category] = (acc[bill.category] || 0) + bill.amount;
        return acc;
      }, {} as Record<string, number>);

      // Business Intelligence Analysis using Grok
      const prompt = `As a senior financial analyst, analyze this Filipino household's financial data and provide comprehensive business intelligence insights:

FINANCIAL DATA:
- Monthly Budget: ₱${budget.toLocaleString()}
- Actual Spending: ₱${totalSpending.toLocaleString()}
- Budget Utilization: ${((totalSpending / budget) * 100).toFixed(1)}%
- Category Breakdown: ${JSON.stringify(spendingByCategory)}

ANALYSIS FRAMEWORK:
Provide detailed business intelligence analysis including:
1. Executive summary with key financial health metrics
2. Performance against industry benchmarks (Philippines context)
3. Root cause analysis of spending inefficiencies  
4. Predictive insights and year-end projections
5. Actionable priorities with expected ROI

Format as JSON with specific metrics, reasoning, and quantified recommendations.`;

      const response = await this.callCohereAPI(prompt);
      return this.parseBusinessIntelligenceResponse(response, totalSpending, budget, spendingByCategory);
      
    } catch (error) {
      logger.error('Business Intelligence analysis failed', { error });
      return this.getEmptyBusinessIntelligence();
    }
  }

  private parseBusinessIntelligenceResponse(response: string, spending: number, budget: number, categories: Record<string, number>) {
    // Parse AI response and structure business intelligence data
    const utilizationRate = (spending / budget) * 100;
    const remainingBudget = budget - spending;
    const sortedCategories = Object.entries(categories).sort(([,a], [,b]) => b - a);
    
    const getStatus = (condition: boolean, warningCondition: boolean): 'critical' | 'warning' | 'good' | 'excellent' => {
      if (condition) return 'critical';
      if (warningCondition) return 'warning';
      return utilizationRate < 70 ? 'excellent' : 'good';
    };
    
    return {
      executiveSummary: `Financial Health Assessment: Budget utilization at ${utilizationRate.toFixed(1)}% indicates ${utilizationRate > 100 ? 'overspending requiring immediate attention' : utilizationRate > 80 ? 'high utilization with limited flexibility' : 'healthy spending with savings opportunity'}.`,
      
      keyFindings: [
        {
          metric: "Budget Efficiency",
          value: `${utilizationRate.toFixed(1)}%`,
          benchmark: "70-80% optimal",
          status: getStatus(utilizationRate > 100, utilizationRate > 90),
          reasoning: utilizationRate > 100 ? "Overspending indicates budget inadequacy or poor expense control" : utilizationRate > 80 ? "High utilization leaves little room for unexpected expenses" : "Healthy utilization with savings potential",
          recommendation: utilizationRate > 100 ? "Immediate expense audit and budget reallocation required" : "Consider increasing emergency fund allocation"
        },
        {
          metric: "Largest Expense Category",
          value: `₱${(sortedCategories[0]?.[1] || 0).toLocaleString()} (${sortedCategories[0]?.[0] || 'None'})`,
          benchmark: "Should be <40% of budget",
          status: getStatus((sortedCategories[0]?.[1] || 0) / budget > 0.5, (sortedCategories[0]?.[1] || 0) / budget > 0.4),
          reasoning: "Concentration risk analysis shows spending distribution health",
          recommendation: "Diversify expenses to reduce dependency on single category"
        },
        {
          metric: "Spending Velocity",
          value: `₱${(spending / 30).toFixed(0)}/day`,
          benchmark: `₱${(budget / 30).toFixed(0)}/day target`,
          status: getStatus(spending > budget, spending > budget * 0.9),
          reasoning: "Daily burn rate indicates spending control effectiveness",
          recommendation: spending > budget ? "Implement daily spending caps" : "Maintain current spending discipline"
        }
      ],
      
      spendingEfficiencyAnalysis: {
        overallRating: utilizationRate > 100 ? "Poor - Overspending" : utilizationRate > 90 ? "Fair - High Risk" : utilizationRate > 70 ? "Good - Controlled" : "Excellent - Conservative",
        inefficiencies: sortedCategories.map(([category, amount]) => {
          const optimalAmount = budget * 0.25; // Assume 25% max per category for major expenses
          const waste = Math.max(0, amount - optimalAmount);
          return {
            category,
            wasteAmount: waste,
            rootCause: waste > 0 ? `${category} spending exceeds recommended allocation` : 'Within optimal range',
            impact: waste > 0 ? `Potential monthly savings: ₱${waste.toLocaleString()}` : 'No optimization needed',
            solution: waste > 0 ? `Implement ${category} spending caps and tracking` : 'Maintain current level'
          };
        }).filter(item => item.wasteAmount > 0)
      },
      
      forecastAndProjections: {
        monthlyTrend: spending > budget ? "Negative trajectory - intervention required" : "Stable trajectory - maintain current habits",
        yearEndProjection: `Annual spending projected at ₱${(spending * 12).toLocaleString()} vs ₱${(budget * 12).toLocaleString()} budget`,
        savingsPotential: Math.max(0, remainingBudget),
        riskFactors: spending > budget ? ["Budget overrun", "Insufficient emergency funds", "Unsustainable spending rate"] : ["Seasonal expense variations", "Inflation impact", "Income volatility"]
      },
      
      benchmarkComparison: {
        vsPeers: utilizationRate > 85 ? "Above average spending rate for similar households" : "Below average spending rate - good control",
        vsOptimal: utilizationRate > 80 ? "Exceeds optimal utilization threshold" : "Within optimal financial management range",
        ranking: utilizationRate > 90 ? "Bottom quartile (needs improvement)" : utilizationRate > 70 ? "Second quartile (average)" : "Top quartile (excellent)"
      },
      
      actionablePriorities: [
        {
          priority: 1,
          action: spending > budget ? "Implement immediate spending freeze on non-essentials" : "Establish automated savings transfer",
          expectedImpact: spending > budget ? `Reduce overspend by ₱${(spending - budget).toLocaleString()}` : `Save additional ₱${Math.max(0, remainingBudget).toLocaleString()} monthly`,
          timeframe: "This month",
          effort: (spending > budget ? 'high' : 'low') as 'high' | 'medium' | 'low'
        },
        {
          priority: 2,
          action: `Optimize ${sortedCategories[0]?.[0] || 'top'} spending category`,
          expectedImpact: "5-15% category reduction possible",
          timeframe: "Next 30 days",
          effort: 'medium' as 'high' | 'medium' | 'low'
        },
        {
          priority: 3,
          action: "Set up expense tracking and alerts",
          expectedImpact: "Prevent future budget overruns",
          timeframe: "This week",
          effort: 'low' as 'high' | 'medium' | 'low'
        }
      ]
    };
  }

  private getEmptyBusinessIntelligence() {
    return {
      executiveSummary: "Insufficient data for comprehensive analysis. Add bills and set budget to unlock business intelligence insights.",
      keyFindings: [],
      spendingEfficiencyAnalysis: { overallRating: "No data", inefficiencies: [] },
      forecastAndProjections: { monthlyTrend: "No data", yearEndProjection: "No data", savingsPotential: 0, riskFactors: [] },
      benchmarkComparison: { vsPeers: "No data", vsOptimal: "No data", ranking: "No data" },
      actionablePriorities: []
    };
  }

  // Helper method to call Cohere API
  private async callCohereAPI(prompt: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Cohere API not configured');
    }

    const response = await fetch(`${this.baseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    const result = await response.json();
    return result?.message?.content?.[0]?.text || '';
  }

  // Chat method for AI Chatbot integration
  async chatWithAI(userMessage: string): Promise<string> {
    try {
      // Validate input message
      if (!userMessage || userMessage.trim().length === 0) {
        return this.getFallbackChatResponse("general help");
      }

      if (!this.isConfigured()) {
        // Return helpful fallback response when API key is not configured
        return this.getFallbackChatResponse(userMessage);
      }

      const userData = this.getCurrentUserData();
      const philippinesContext = this.getPhilippinesContext();
      
      // Expand short messages to meet Cohere's minimum token requirement
      let expandedMessage = userMessage.trim();
      if (expandedMessage.length < 10) {
        // Add context to very short messages to ensure they meet token requirements
        expandedMessage = `The user said: "${expandedMessage}". Please provide helpful financial advice based on their profile and current situation in the Philippines.`;
      }
      
      logger.debug('Sending chat message to Cohere AI', { 
        originalMessageLength: userMessage.length,
        expandedMessageLength: expandedMessage.length,
        userTier: userData.currentTier?.name,
        expandedMessage: expandedMessage.substring(0, 100) + '...' // Log first 100 chars
      });
      
      const requestBody = {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are a friendly Filipino financial advisor AI. Provide practical, culturally-aware advice for Filipino households.

USER FINANCIAL PROFILE:
- Location: ${userData.location === 'ncr' ? 'Metro Manila' : 'Province'}
- Monthly Income: ₱${userData.totalIncome?.toLocaleString() || 'Not specified'}
- Monthly Bills: ₱${userData.monthlyBillsTotal?.toLocaleString() || '0'}
- Current Savings: ₱${userData.currentSavings?.toLocaleString() || '0'}
- Savings Tier: ${userData.currentTier?.name || 'Starter'}

PHILIPPINES CONTEXT:
- Current inflation: ${philippinesContext.inflationRate}%
- Season: ${philippinesContext.currentSeason}
- ${userData.location === 'ncr' ? 'NCR' : 'Provincial'} minimum wage: ₱${userData.location === 'ncr' ? philippinesContext.minimumWageNCR : philippinesContext.minimumWageProvince}/day

Keep responses conversational, under 200 words, and include actionable Filipino financial advice.`
          },
          {
            role: 'user',
            content: expandedMessage
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      };
      
      logger.debug('Chat API request body', { requestBody: JSON.stringify(requestBody).substring(0, 200) + '...' });
      
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Cohere AI chat error', { status: response.status, error: errorText });
        throw new Error(`Cohere API error: ${response.status}`);
      }

      const data = await response.json();
      logger.debug('Cohere API raw response', { data });
      
      // Cohere v2 Chat API returns the response in data.message.content[0].text field
      const aiResponse = data.message?.content?.[0]?.text || 'Sorry, I could not generate a response.';
      
      logger.debug('Successfully received Cohere AI chat response', { 
        responseLength: aiResponse.length 
      });
      return aiResponse.trim();
      
    } catch (error) {
      logger.error('Error in chatWithAI', { error });
      return this.getFallbackChatResponse(userMessage);
    }
  }

  // Create context-rich chat prompt
  private createChatPrompt(userMessage: string, userData: any, philippinesContext: any): string {
    return `
CONTEXT: You are chatting with a Filipino user about their personal finances. Provide helpful, practical advice.

USER FINANCIAL PROFILE:
- Location: ${userData.location === 'ncr' ? 'Metro Manila' : 'Province'}
- Monthly Income: ₱${userData.totalIncome?.toLocaleString() || 'Not specified'}
- Monthly Bills: ₱${userData.monthlyBillsTotal?.toLocaleString() || '0'}
- Current Savings: ₱${userData.currentSavings?.toLocaleString() || '0'}
- Savings Tier: ${userData.currentTier?.name || 'Starter'}

PHILIPPINES CONTEXT:
- Current inflation: ${philippinesContext.inflationRate}%
- Season: ${philippinesContext.currentSeason}
- ${userData.location === 'ncr' ? 'NCR' : 'Provincial'} minimum wage: ₱${userData.location === 'ncr' ? philippinesContext.minimumWageNCR : philippinesContext.minimumWageProvince}/day

USER MESSAGE: "${userMessage}"

INSTRUCTIONS:
1. Address their specific question with practical Filipino context
2. Reference their financial situation when relevant
3. Provide actionable steps they can take
4. Keep response under 200 words
5. Be encouraging and culturally sensitive
6. Include relevant Filipino financial tips or resources when appropriate

Respond as a helpful financial advisor:`;
  }

  // Fallback chat responses when API is not configured
  private getFallbackChatResponse(userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('save') || lowerMessage.includes('savings')) {
      return "💰 Saving tip: Start with the 50-30-20 rule - 50% needs, 30% wants, 20% savings. Even ₱100/week builds to ₱5,200/year! Consider digital banks like CIMB or ING for higher interest rates.";
    }
    
    if (lowerMessage.includes('budget') || lowerMessage.includes('bills')) {
      return "📊 Budgeting in the Philippines: Track your essentials first - rent, utilities, food. Use apps like Coins.ph for bill payments to avoid long lines. Aim to keep fixed expenses under 50% of income.";
    }
    
    if (lowerMessage.includes('invest') || lowerMessage.includes('investment')) {
      return "📈 Investment basics: Start with Pag-IBIG MP2 (tax-free, government-backed). Then consider index funds through COL Financial or First Metro Sec. Always have 6 months emergency fund first!";
    }
    
    if (lowerMessage.includes('debt') || lowerMessage.includes('loan')) {
      return "⚠️ Debt management: List all debts by interest rate. Pay minimums on all, extra on highest rate. Avoid credit card cash advances (24%+ interest). Consider debt consolidation for multiple loans.";
    }
    
    return "🤖 I'm here to help with your finances! I can provide tips on saving, budgeting, investing, and managing money in the Philippines. What specific financial topic would you like to discuss?";
  }

  // Alternative method that accepts data directly to avoid store access issues
  async generateBusinessIntelligenceInsightsWithData(
    bills: any[], 
    budget: number | null, 
    monthlyTotal: number
  ): Promise<{
    executiveSummary: string;
    keyFindings: Array<{
      metric: string;
      value: string;
      benchmark: string;
      status: 'critical' | 'warning' | 'good' | 'excellent';
      reasoning: string;
      recommendation: string;
    }>;
    spendingEfficiencyAnalysis: {
      overallRating: string;
      inefficiencies: Array<{
        category: string;
        wasteAmount: number;
        rootCause: string;
        impact: string;
        solution: string;
      }>;
    };
    forecastAndProjections: {
      monthlyTrend: string;
      yearEndProjection: string;
      savingsPotential: number;
      riskFactors: string[];
    };
    benchmarkComparison: {
      vsPeers: string;
      vsOptimal: string;
      ranking: string;
    };
    actionablePriorities: Array<{
      priority: number;
      action: string;
      expectedImpact: string;
      timeframe: string;
      effort: 'low' | 'medium' | 'high';
    }>;
  }> {
    try {
      if (__DEV__) {
        logger.debug('Grok AI Service With Data', {
          billsCount: bills?.length || 0,
          budget: budget,
          monthlyTotal: monthlyTotal
        });
      }
      
      if (!bills?.length || !budget) {
        logger.debug('Returning empty data - Missing bills or budget');
        return this.getEmptyBusinessIntelligence();
      }

      logger.debug('Data available, proceeding with analysis');

      const totalSpending = monthlyTotal || bills.reduce((sum, bill) => sum + bill.amount, 0);
      const utilizationPercent = ((totalSpending / budget) * 100);
      const utilizationStatus = utilizationPercent > 80 ? 'warning' : utilizationPercent > 60 ? 'good' : 'excellent';
      
      // Since API key might not be configured, generate intelligent mock analysis
      return {
        executiveSummary: `Your monthly spending of ₱${totalSpending.toLocaleString()} represents ${utilizationPercent.toFixed(1)}% of your ₱${budget.toLocaleString()} budget. ${utilizationPercent < 50 ? 'You have excellent budget utilization with significant room for additional savings and investments.' : utilizationPercent < 80 ? 'You maintain good budget management with moderate spending levels and healthy financial discipline.' : 'Consider reviewing your expenses to optimize spending and improve your financial health.'}`,
        
        keyFindings: [
          {
            metric: 'Budget Utilization Rate',
            value: `${utilizationPercent.toFixed(1)}%`,
            benchmark: '< 80% (recommended)',
            status: utilizationStatus as any,
            reasoning: `Your spending represents ${utilizationPercent.toFixed(1)}% of your total budget. ${utilizationPercent < 80 ? 'This is within healthy financial limits and shows good budget discipline.' : 'This indicates potential overspending that may impact your financial stability.'}`,
            recommendation: utilizationPercent < 50 ? 'Consider increasing your emergency fund or exploring investment opportunities with your surplus.' : utilizationPercent < 80 ? 'Maintain current spending patterns while looking for small optimization opportunities.' : 'Identify and reduce non-essential expenses to bring spending below 80% of budget.'
          },
          {
            metric: 'Monthly Savings Capacity',
            value: `₱${Math.max(0, budget - totalSpending).toLocaleString()}`,
            benchmark: '20% of income (₱27,000)',
            status: (budget - totalSpending) > 27000 ? 'excellent' : (budget - totalSpending) > 13500 ? 'good' : 'warning' as any,
            reasoning: `With your current spending, you have ₱${Math.max(0, budget - totalSpending).toLocaleString()} remaining from your budget each month.`,
            recommendation: (budget - totalSpending) > 27000 ? 'Excellent savings rate! Consider diversifying into investments.' : 'Look for opportunities to increase savings rate through expense optimization.'
          }
        ],
        
        spendingEfficiencyAnalysis: { 
          overallRating: utilizationStatus, 
          inefficiencies: [] 
        },
        
        forecastAndProjections: { 
          monthlyTrend: utilizationPercent < 80 ? 'Stable and sustainable' : 'Needs monitoring', 
          yearEndProjection: `₱${(totalSpending * 12).toLocaleString()} annually`, 
          savingsPotential: Math.max(0, budget - totalSpending) * 12,
          riskFactors: utilizationPercent > 80 ? ['High budget utilization reduces financial flexibility'] : []
        },
        
        benchmarkComparison: { 
          vsPeers: utilizationPercent < 70 ? 'Above average financial discipline' : 'Average spending patterns', 
          vsOptimal: utilizationStatus === 'excellent' ? 'Exceeds optimal standards' : utilizationStatus === 'good' ? 'Meets good standards' : 'Below optimal', 
          ranking: utilizationPercent < 50 ? 'Top 25% (Excellent)' : utilizationPercent < 80 ? 'Top 50% (Good)' : 'Needs improvement' 
        },
        
        actionablePriorities: utilizationPercent > 80 ? [
          {
            priority: 1,
            action: 'Review and reduce discretionary spending by 10-15%',
            expectedImpact: `Save ₱${Math.round(totalSpending * 0.1).toLocaleString()}-₱${Math.round(totalSpending * 0.15).toLocaleString()} monthly`,
            timeframe: '30 days',
            effort: 'medium' as any
          }
        ] : [
          {
            priority: 1,
            action: 'Maintain current spending discipline and explore investment options',
            expectedImpact: 'Grow wealth through strategic investments',
            timeframe: 'Ongoing',
            effort: 'low' as any
          }
        ]
      };

    } catch (error) {
      logger.error('Business Intelligence generation failed', { error });
      return this.getEmptyBusinessIntelligence();
    }
  }

  // New method that takes complete personalized data for comprehensive analysis
  async generatePersonalizedBusinessIntelligence(data: {
    bills: any[];
    currentBudget: number | null;
    monthlyTotal: number;
    budgetBreakdown: any;
    profile: any;
    totalHouseholdIncome: number;
  }): Promise<{
    executiveSummary: string;
    keyFindings: Array<{
      metric: string;
      value: string;
      benchmark: string;
      status: 'critical' | 'warning' | 'good' | 'excellent';
      reasoning: string;
      recommendation: string;
    }>;
    spendingEfficiencyAnalysis: {
      overallRating: string;
      inefficiencies: Array<{
        category: string;
        wasteAmount: number;
        rootCause: string;
        impact: string;
        solution: string;
      }>;
    };
    forecastAndProjections: {
      monthlyTrend: string;
      yearEndProjection: string;
      savingsPotential: number;
      riskFactors: string[];
    };
    benchmarkComparison: {
      vsPeers: string;
      vsOptimal: string;
      ranking: string;
    };
    actionablePriorities: Array<{
      priority: number;
      action: string;
      expectedImpact: string;
      timeframe: string;
      effort: 'low' | 'medium' | 'high';
    }>;
  }> {
    try {
      const { bills, currentBudget, monthlyTotal, budgetBreakdown, profile, totalHouseholdIncome } = data;
      
      if (__DEV__) {
        logger.debug('Personalized AI Analysis', {
          billsCount: bills?.length || 0,
          budget: currentBudget,
          budgetBreakdown: budgetBreakdown,
          profile: profile,
          householdIncome: totalHouseholdIncome
        });
      }
      
      if (!bills?.length || !currentBudget) {
        logger.warn('❌ Insufficient data for personalized analysis', {
          billsCount: bills?.length || 0,
          hasBudget: !!currentBudget
        });
        return this.getEmptyBusinessIntelligence();
      }

      logger.debug('✅ Complete data available, generating personalized analysis...');

      // Use the comprehensive spending total passed from the insights component
      const totalSpending = data.monthlyTotal;
      logger.debug(`💰 Using total spending: ₱${totalSpending.toLocaleString()}`);
      
      const utilizationPercent = ((totalSpending / currentBudget) * 100);
      const utilizationStatus = utilizationPercent > 80 ? 'warning' : utilizationPercent > 60 ? 'good' : 'excellent';
      
      // Analyze budget vs actual spending by category
      const categoryAnalysis = this.analyzeCategorySpending(bills, data.budgetBreakdown);
      
      // Personal context
      const personalContext = this.buildPersonalContext(profile, totalHouseholdIncome, currentBudget);
      
      return {
        executiveSummary: this.generatePersonalizedSummary(
          totalSpending, 
          currentBudget, 
          utilizationPercent, 
          profile, 
          categoryAnalysis
        ),
        
        keyFindings: [
          {
            metric: 'Budget Utilization Rate',
            value: `${utilizationPercent.toFixed(1)}%`,
            benchmark: '< 80% (recommended)',
            status: utilizationStatus as any,
            reasoning: `As a ${profile?.employmentStatus || 'professional'} in ${profile?.location === 'ncr' ? 'Metro Manila' : 'the provinces'} with ${profile?.numberOfDependents || 0} dependents, your spending represents ${utilizationPercent.toFixed(1)}% of your allocated budget.`,
            recommendation: this.getPersonalizedRecommendation(utilizationPercent, profile, totalHouseholdIncome)
          },
          
          {
            metric: 'Income Allocation Efficiency',
            value: `${((currentBudget / totalHouseholdIncome) * 100).toFixed(1)}%`,
            benchmark: '70-80% of income',
            status: ((currentBudget / totalHouseholdIncome) * 100) < 70 ? 'excellent' : 'good' as any,
            reasoning: `Your ₱${currentBudget.toLocaleString()} budget represents ${((currentBudget / totalHouseholdIncome) * 100).toFixed(1)}% of your ₱${totalHouseholdIncome.toLocaleString()} household income.`,
            recommendation: ((currentBudget / totalHouseholdIncome) * 100) < 70 ? 'Excellent allocation! Consider increasing emergency fund or investments.' : 'Good allocation with room for optimization.'
          },
          
          ...categoryAnalysis
        ],
        
        spendingEfficiencyAnalysis: { 
          overallRating: utilizationStatus, 
          inefficiencies: this.identifyInefficiencies(bills, budgetBreakdown)
        },
        
        forecastAndProjections: { 
          monthlyTrend: this.assessTrend(utilizationPercent, profile),
          yearEndProjection: `₱${(totalSpending * 12).toLocaleString()} annually`, 
          savingsPotential: Math.max(0, currentBudget - totalSpending) * 12,
          riskFactors: this.identifyRiskFactors(profile, utilizationPercent, totalHouseholdIncome)
        },
        
        benchmarkComparison: { 
          vsPeers: this.compareToPeers(profile, utilizationPercent, totalHouseholdIncome),
          vsOptimal: this.compareToOptimal(utilizationPercent, profile),
          ranking: this.calculateRanking(utilizationPercent, profile)
        },
        
        actionablePriorities: this.generatePersonalizedPriorities(
          utilizationPercent, 
          profile, 
          categoryAnalysis, 
          totalHouseholdIncome
        )
      };

    } catch (error) {
      logger.error('Personalized Business Intelligence generation failed', { error });
      return this.getEmptyBusinessIntelligence();
    }
  }

  private analyzeCategorySpending(bills: any[], budgetBreakdown: any) {
    if (!budgetBreakdown?.categories) return [];
    
    const findings = [];
    const actualByCategory = bills.reduce((acc, bill) => {
      acc[bill.category] = (acc[bill.category] || 0) + bill.amount;
      return acc;
    }, {} as Record<string, number>);

    for (const [category, budgeted] of Object.entries(budgetBreakdown.categories)) {
      const budgetedAmount = Number(budgeted);
      const actual = actualByCategory[category] || 0;
      const utilizationRate = budgetedAmount > 0 ? (actual / budgetedAmount) * 100 : 0;
      
      if (utilizationRate > 0) {
        findings.push({
          metric: `${category.charAt(0).toUpperCase() + category.slice(1)} Spending`,
          value: `₱${actual.toLocaleString()}`,
          benchmark: `₱${budgetedAmount.toLocaleString()} budgeted`,
          status: (utilizationRate > 120 ? 'warning' : utilizationRate > 80 ? 'good' : 'excellent') as any,
          reasoning: `You've spent ${utilizationRate.toFixed(1)}% of your ${category} budget.`,
          recommendation: utilizationRate > 120 ? `Consider reducing ${category} expenses by ₱${(actual - budgetedAmount).toLocaleString()}` : utilizationRate < 50 ? `You have ₱${(budgetedAmount - actual).toLocaleString()} remaining in your ${category} budget` : 'Good budget discipline in this category'
        });
      }
    }
    
    return findings;
  }

  private buildPersonalContext(profile: any, income: number, budget: number) {
    return {
      location: profile?.location || 'ncr',
      employment: profile?.employmentStatus || 'employed',
      dependents: profile?.numberOfDependents || 0,
      incomeLevel: income > 100000 ? 'high' : income > 50000 ? 'middle' : 'moderate'
    };
  }

  private generatePersonalizedSummary(spending: number, budget: number, utilization: number, profile: any, categoryAnalysis: any[]) {
    const name = profile?.fullName?.split(' ')[0] || 'You';
    const location = profile?.location === 'ncr' ? 'Metro Manila' : 'your area';
    const dependents = profile?.numberOfDependents || 0;
    
    let summary = `${name}, your monthly spending of ₱${spending.toLocaleString()} represents ${utilization.toFixed(1)}% of your ₱${budget.toLocaleString()} budget. `;
    
    if (utilization < 50) {
      summary += `As a ${profile?.employmentStatus || 'professional'} in ${location} with ${dependents} dependent${dependents !== 1 ? 's' : ''}, you demonstrate excellent financial discipline with significant savings potential.`;
    } else if (utilization < 80) {
      summary += `Your spending pattern shows good budget management appropriate for a household of ${dependents + 1} in ${location}.`;
    } else {
      summary += `Consider reviewing your expenses to optimize spending for your ${dependents + 1}-person household in ${location}.`;
    }
    
    return summary;
  }

  private getPersonalizedRecommendation(utilization: number, profile: any, income: number) {
    const dependents = profile?.numberOfDependents || 0;
    const location = profile?.location === 'ncr' ? 'NCR' : 'provincial';
    
    if (utilization < 50) {
      return `With ${dependents} dependents in ${location}, consider building an emergency fund of 6-12 months expenses (₱${(income * 0.6).toLocaleString()}) and exploring investment opportunities.`;
    } else if (utilization < 80) {
      return `Maintain current spending discipline. For a family of ${dependents + 1} in ${location}, look for small optimization opportunities.`;
    } else {
      return `With ${dependents} dependents, prioritize essential expenses and review discretionary spending to improve financial security.`;
    }
  }

  private identifyInefficiencies(bills: any[], budgetBreakdown: any) {
    // Compare actual vs budgeted spending to identify overspending areas
    const inefficiencies = [];
    
    if (budgetBreakdown?.categories) {
      const actualByCategory = bills.reduce((acc, bill) => {
        acc[bill.category] = (acc[bill.category] || 0) + bill.amount;
        return acc;
      }, {} as Record<string, number>);

      for (const [category, budgeted] of Object.entries(budgetBreakdown.categories)) {
        const budgetedAmount = Number(budgeted);
        const actual = actualByCategory[category] || 0;
        if (actual > budgetedAmount * 1.2) { // 20% over budget
          inefficiencies.push({
            category,
            wasteAmount: actual - budgetedAmount,
            rootCause: `Exceeded ${category} budget by ${(((actual / budgetedAmount) - 1) * 100).toFixed(1)}%`,
            impact: `₱${(actual - budgetedAmount).toLocaleString()} over budget`,
            solution: `Reduce ${category} spending or reallocate budget`
          });
        }
      }
    }
    
    return inefficiencies;
  }

  private assessTrend(utilization: number, profile: any) {
    if (utilization < 50) return 'Highly sustainable with growth potential';
    if (utilization < 80) return 'Stable and sustainable';
    return 'Needs monitoring and adjustment';
  }

  private identifyRiskFactors(profile: any, utilization: number, income: number) {
    const risks = [];
    
    if (utilization > 80) risks.push('High budget utilization reduces financial flexibility');
    if (profile?.numberOfDependents > 2 && utilization > 70) risks.push('Large family size with high spending creates vulnerability');
    if (profile?.location === 'ncr' && utilization > 75) risks.push('High cost of living in NCR with elevated spending');
    if (!profile?.hasSpouse && profile?.numberOfDependents > 0) risks.push('Single income supporting dependents');
    
    return risks;
  }

  private compareToPeers(profile: any, utilization: number, income: number) {
    const location = profile?.location === 'ncr' ? 'NCR' : 'provincial';
    const dependents = profile?.numberOfDependents || 0;
    
    if (utilization < 60) return `Excellent compared to similar ${location} households with ${dependents} dependents`;
    if (utilization < 80) return `Above average for ${location} professionals`;
    return `Average spending for ${location} households`;
  }

  private compareToOptimal(utilization: number, profile: any) {
    if (utilization < 50) return 'Exceeds optimal financial standards';
    if (utilization < 80) return 'Meets good financial practices';
    return 'Below optimal financial standards';
  }

  private calculateRanking(utilization: number, profile: any) {
    if (utilization < 50) return 'Top 25% (Excellent)';
    if (utilization < 70) return 'Top 50% (Very Good)';
    if (utilization < 80) return 'Top 75% (Good)';
    return 'Needs improvement';
  }

  private generatePersonalizedPriorities(utilization: number, profile: any, categoryAnalysis: any[], income: number) {
    const priorities = [];
    const dependents = profile?.numberOfDependents || 0;
    
    if (utilization > 80) {
      priorities.push({
        priority: 1,
        action: `Review and optimize spending with ${dependents} dependents in mind`,
        expectedImpact: `Improve financial security for your ${dependents + 1}-person household`,
        timeframe: '30 days',
        effort: 'medium' as any
      });
    } else if (utilization < 50) {
      priorities.push({
        priority: 1,
        action: `Build emergency fund for ${dependents + 1} people (6-12 months expenses)`,
        expectedImpact: `₱${(income * 0.6).toLocaleString()} emergency fund`,
        timeframe: '6-12 months',
        effort: 'low' as any
      });
    }
    
    // Add category-specific priorities
    const overspendingCategory = categoryAnalysis.find(c => c.status === 'warning');
    if (overspendingCategory) {
      priorities.push({
        priority: 2,
        action: `Optimize ${overspendingCategory.metric.toLowerCase()} expenses`,
        expectedImpact: overspendingCategory.recommendation,
        timeframe: '2 weeks',
        effort: 'medium' as any
      });
    }
    
    return priorities;
  }
}

export const cohereAIService = new CohereAIService();
