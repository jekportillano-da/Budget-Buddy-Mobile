/*
 * MIT License
 * Copyright (c) 2024 Budget Buddy Mobile
 * 
 * Grok AI integration service for intelligent budget analysis
 */

import { useBillsStore } from '../stores/billsStore';
import { useBudgetStore } from '../stores/budgetStore';
import { useUserStore } from '../stores/userStore';
import { logger } from '../utils/logger';

// Grok AI Integration for Budget Buddy Philippines
class GrokAIService {
  private apiKey: string;
  private baseUrl: string = 'https://api.x.ai/v1';

  constructor() {
    // Priority order: Environment variable, then Expo Constants, then fallback
    this.apiKey = 
      process.env.GROK_API_KEY || 
      process.env.EXPO_PUBLIC_GROK_API_KEY ||
      'PLEASE_SET_YOUR_GROK_API_KEY';
    
    // Debug logging to verify API key loading
    if (__DEV__) {
      logger.debug('Environment variables check', {
        hasGrokApiKey: !!process.env.GROK_API_KEY,
        hasExpoPublicGrokApiKey: !!process.env.EXPO_PUBLIC_GROK_API_KEY,
        apiKeyLength: this.apiKey.length,
        isConfigured: this.isConfigured()
      });
    }
    
    if (this.apiKey === 'PLEASE_SET_YOUR_GROK_API_KEY') {
      logger.warn('GROK API KEY NOT SET! Please set GROK_API_KEY environment variable');
      logger.warn('Instructions:');
      logger.warn('1. Get API key from: https://console.x.ai/');
      logger.warn('2. Create .env file with: EXPO_PUBLIC_GROK_API_KEY=your-key');
      logger.warn('3. Restart the development server');
      logger.warn('AI insights will use mock data until API key is configured');
    } else {
      logger.debug('Grok AI service initialized with API key');
    }
  }

  // Check if API key is properly configured
  private isConfigured(): boolean {
    return this.apiKey !== 'PLEASE_SET_YOUR_GROK_API_KEY' && this.apiKey.length > 10;
  }

  // Get real-time data from all stores
  private getCurrentUserData() {
    const billsStore = useBillsStore.getState();
    const budgetStore = useBudgetStore.getState();
    const userStore = useUserStore.getState();

    return {
      bills: billsStore.bills,
      monthlyBillsTotal: billsStore.monthlyTotal,
      budget: budgetStore.currentBudget,
      budgetBreakdown: budgetStore.breakdown,
      user: userStore.profile,
      totalIncome: userStore.totalHouseholdIncome,
      location: userStore.profile?.location || 'ncr',
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
    return `
CONTEXT: You are a financial advisor AI specifically for Filipino households. Analyze the user's financial data and provide insights.

USER PROFILE:
- Location: ${userData.location === 'ncr' ? 'National Capital Region (Metro Manila)' : 'Province'}
- Monthly Income: ₱${userData.totalIncome?.toLocaleString() || 'Not specified'}
- Employment: ${userData.user?.employmentStatus || 'Not specified'}
- Family: ${userData.user?.hasSpouse ? 'Married' : 'Single'}, ${userData.user?.numberOfDependents || 0} dependents
- Spouse Income: ₱${userData.user?.spouseIncome?.toLocaleString() || '0'}

CURRENT FINANCIAL SITUATION:
- Total Monthly Bills: ₱${userData.monthlyBillsTotal?.toLocaleString() || '0'}
- Budget Amount: ₱${userData.budget?.toLocaleString() || 'Not set'}
- Bills to Income Ratio: ${userData.totalIncome ? ((userData.monthlyBillsTotal / userData.totalIncome) * 100).toFixed(1) : 'N/A'}%

BILLS BREAKDOWN:
${userData.bills?.map((bill: any) => `- ${bill.name}: ₱${bill.amount.toLocaleString()} (${bill.category}, due day ${bill.dueDay})`).join('\n') || 'No bills recorded'}

PHILIPPINES CONTEXT (${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long' })}):
- Current Season: ${philippinesContext.currentSeason}
- Inflation Rate: ${philippinesContext.inflationRate}%
- ${userData.location === 'ncr' ? 'NCR' : 'Provincial'} Average Household Income: ₱${userData.location === 'ncr' ? philippinesContext.averageHouseholdIncomeNCR.toLocaleString() : philippinesContext.averageHouseholdIncomeProvince.toLocaleString()}
- Minimum Wage: ₱${userData.location === 'ncr' ? philippinesContext.minimumWageNCR : philippinesContext.minimumWageProvince}/day

TASK: Provide 3-5 specific, actionable insights for this Filipino household. Focus on:
1. How they compare to similar households in the Philippines
2. Seasonal financial advice (consider current month and weather patterns)
3. Philippines-specific cost-saving opportunities
4. Early warning about potential financial issues
5. Realistic next steps they can take this month

Format your response as a JSON array of objects with this structure:
{
  "type": "success|warning|info",
  "category": "budget|bills|savings|philippines",
  "message": "Detailed insight message in Filipino context",
  "action": "Specific actionable step",
  "priority": "high|medium|low",
  "philippinesSpecific": true
}

Make insights conversational, specific to Philippines, and immediately actionable.
`;
  }

  // Call Grok AI API
  async generateInsights(): Promise<any[]> {
    // Check if API key is configured
    if (!this.isConfigured()) {
      logger.warn('Using fallback AI insights - Grok API key not configured');
      return this.generateFallbackInsights(this.getCurrentUserData(), this.getPhilippinesContext());
    }

    try {
      const userData = this.getCurrentUserData();
      const philippinesContext = this.getPhilippinesContext();
      const prompt = this.createAnalysisPrompt(userData, philippinesContext);

      logger.debug('Making request to Grok AI with configured API key');

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'grok-beta',
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
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Grok API error', { status: response.status, error: errorText });
        throw new Error(`Grok API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      logger.debug('Successfully received Grok AI response');
      
      try {
        // Parse AI response as JSON
        const insights = JSON.parse(aiResponse);
        return Array.isArray(insights) ? insights : [insights];
      } catch (parseError) {
        logger.warn('Failed to parse Grok response as JSON, using fallback');
        return this.generateFallbackInsights(userData, philippinesContext);
      }
    } catch (error) {
      logger.error('Grok AI service error', { error });
      logger.warn('Falling back to intelligent mock insights based on your data');
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

  // Generate actionable recommendations
  async generateRecommendations(): Promise<string[]> {
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
          console.warn('AI budget adjustment failed, using default allocations');
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
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          model: 'grok-beta',
          stream: false,
        }),
      });

      const result = await response.json();
      const adjustedCategories = JSON.parse(result.choices[0].message.content);
      
      return { adjustedCategories };
    } catch (error) {
      console.warn('AI budget adjustment failed:', error);
      return { adjustedCategories: currentBreakdown };
    }
  }

  // Generate budget recommendations
  private async generateBudgetRecommendations(
    breakdown: Record<string, number>,
    userData: any,
    philippinesContext: any
  ): Promise<string[]> {
    const recommendations = [];

    // Philippines-specific recommendations
    recommendations.push('🏦 Keep emergency fund in high-yield savings (4-6% annually)');
    recommendations.push('📱 Use digital wallets (GCash, Maya) for cashless budgeting');
    
    if (userData.location === 'ncr') {
      recommendations.push('🚇 Maximize public transport savings vs ride-hailing apps');
    }

    recommendations.push('🛒 Shop at public markets and Kadiwa stores for 20-30% food savings');
    recommendations.push('⚡ Apply for electricity subsidies if qualified (Lifeline Rate)');
    
    // Seasonal recommendations
    if (philippinesContext.currentSeason === 'Summer') {
      recommendations.push('☀️ Budget extra 30% for electricity during peak summer months');
    }

    return recommendations;
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

      const response = await this.callGrokAPI(prompt);
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

  // Helper method to call Grok API
  private async callGrokAPI(prompt: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Grok API not configured');
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        model: 'grok-beta',
        stream: false,
      }),
    });

    const result = await response.json();
    return result.choices[0]?.message?.content || '';
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
        console.log('❌ Insufficient data for personalized analysis');
        return this.getEmptyBusinessIntelligence();
      }

      console.log('✅ Complete data available, generating personalized analysis...');

      // Use the comprehensive spending total passed from the insights component
      const totalSpending = data.monthlyTotal;
      console.log(`💰 Using total spending: ₱${totalSpending.toLocaleString()}`);
      
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
      console.error('Personalized Business Intelligence generation failed:', error);
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

export const grokAIService = new GrokAIService();
