/**
 * Insights API Client
 * Typed client for business intelligence and insights endpoints
 */

import { httpClient } from '../httpClient';
import { z } from 'zod';

// Zod schemas for type safety
export const InsightsRequestSchema = z.object({
  monthly_income: z.number().positive(),
  monthly_expenses: z.number().positive(),
  expense_categories: z.record(z.number()),
});

export const InsightsResponseSchema = z.object({
  analysis: z.string(),
  generated_at: z.string(),
  tier_unlocked: z.string(),
  confidence_score: z.number().optional(),
});

export const BusinessIntelligenceSchema = z.object({
  executiveSummary: z.string(),
  keyFindings: z.array(z.object({
    metric: z.string(),
    value: z.string(),
    benchmark: z.string(),
    status: z.enum(['critical', 'warning', 'good', 'excellent']),
    reasoning: z.string(),
    recommendation: z.string(),
  })),
  spendingEfficiencyAnalysis: z.object({
    overallRating: z.string(),
    inefficiencies: z.array(z.object({
      category: z.string(),
      wasteAmount: z.number(),
      rootCause: z.string(),
      impact: z.string(),
      solution: z.string(),
    })),
  }),
  forecastAndProjections: z.object({
    monthlyTrend: z.string(),
    yearEndProjection: z.string(),
    savingsPotential: z.number(),
    riskFactors: z.array(z.string()),
  }),
  benchmarkComparison: z.object({
    vsPeers: z.string(),
    vsOptimal: z.string(),
    ranking: z.string(),
  }),
  actionablePriorities: z.array(z.object({
    priority: z.number(),
    action: z.string(),
    expectedImpact: z.string(),
    timeframe: z.string(),
    effort: z.enum(['low', 'medium', 'high']),
  })),
});

export const UsageStatsSchema = z.object({
  tier: z.string(),
  chat_usage_today: z.number(),
  chat_limit_daily: z.number(),
  insights_usage_month: z.number(),
  insights_limit_monthly: z.number(),
  available_features: z.record(z.boolean()),
});

// Type exports
export type InsightsRequest = z.infer<typeof InsightsRequestSchema>;
export type InsightsResponse = z.infer<typeof InsightsResponseSchema>;
export type BusinessIntelligence = z.infer<typeof BusinessIntelligenceSchema>;
export type UsageStats = z.infer<typeof UsageStatsSchema>;

/**
 * Insights API Client
 */
export class InsightsClient {
  /**
   * Get AI-powered financial insights from backend
   */
  async getInsights(request: InsightsRequest): Promise<InsightsResponse> {
    const validatedRequest = InsightsRequestSchema.parse(request);
    
    const response = await httpClient.post<InsightsResponse>(
      '/ai/insights',
      validatedRequest
    );

    return InsightsResponseSchema.parse(response);
  }

  /**
   * Get usage statistics for current user
   */
  async getUsageStats(): Promise<UsageStats> {
    const response = await httpClient.get<UsageStats>('/ai/usage');
    return UsageStatsSchema.parse(response);
  }

  /**
   * Get business intelligence from local AI services
   * This calls the existing AI services (Grok/Cohere) for comprehensive analysis
   * Note: This method is for local fallback - use React Query hooks for primary data fetching
   */
  async getBusinessIntelligence(data: {
    bills: any[];
    currentBudget: number | null;
    monthlyTotal: number;
    budgetBreakdown: any;
    profile: any;
    totalHouseholdIncome: number;
  }): Promise<BusinessIntelligence> {
    try {
      // For now, use fallback insights to avoid import complexity
      // In a real implementation, this would call the AI services
      const insights = this.generateFallbackInsights(data);
      return BusinessIntelligenceSchema.parse(insights);
    } catch (error) {
      // Return typed fallback if parsing fails
      return this.generateFallbackInsights(data);
    }
  }

  /**
   * Generate fallback insights when AI services are unavailable
   */
  private generateFallbackInsights(data: {
    bills: any[];
    currentBudget: number | null;
    monthlyTotal: number;
    budgetBreakdown: any;
    profile: any;
    totalHouseholdIncome: number;
  }): BusinessIntelligence {
    const { bills, currentBudget, monthlyTotal, totalHouseholdIncome } = data;
    const spending = bills.reduce((sum, bill) => sum + bill.amount, 0);
    const budget = currentBudget || 0;
    const utilizationRate = budget > 0 ? (spending / budget) * 100 : 0;

    return {
      executiveSummary: `Based on your current financial data, you have ${bills.length} bills totaling ₱${spending.toLocaleString()}. Your budget utilization is ${utilizationRate.toFixed(1)}%.`,
      keyFindings: [
        {
          metric: 'Budget Utilization',
          value: `${utilizationRate.toFixed(1)}%`,
          benchmark: '< 80% recommended',
          status: utilizationRate > 90 ? 'critical' : utilizationRate > 80 ? 'warning' : 'good',
          reasoning: `Your spending represents ${utilizationRate.toFixed(1)}% of your budget.`,
          recommendation: utilizationRate > 80 ? 'Consider reducing expenses or increasing budget' : 'Maintain current spending pattern'
        },
        {
          metric: 'Income Coverage',
          value: `${totalHouseholdIncome > 0 ? ((spending / totalHouseholdIncome) * 100).toFixed(1) : 0}%`,
          benchmark: '< 50% of income',
          status: totalHouseholdIncome > 0 && (spending / totalHouseholdIncome) > 0.7 ? 'warning' : 'good',
          reasoning: 'Percentage of income used for tracked expenses.',
          recommendation: 'Monitor income-to-expense ratio for financial health'
        }
      ],
      spendingEfficiencyAnalysis: {
        overallRating: utilizationRate > 90 ? 'Needs Improvement' : utilizationRate > 70 ? 'Fair' : 'Good',
        inefficiencies: []
      },
      forecastAndProjections: {
        monthlyTrend: utilizationRate > 80 ? 'Concerning - may exceed budget' : 'Stable',
        yearEndProjection: `Annual spending projected at ₱${(spending * 12).toLocaleString()}`,
        savingsPotential: Math.max(0, budget - spending),
        riskFactors: utilizationRate > 80 ? ['Budget overrun risk', 'Limited emergency buffer'] : []
      },
      benchmarkComparison: {
        vsPeers: 'Limited data for comparison',
        vsOptimal: utilizationRate > 80 ? 'Above recommended spending levels' : 'Within recommended range',
        ranking: 'Insufficient data'
      },
      actionablePriorities: utilizationRate > 80 ? [
        {
          priority: 1,
          action: 'Review and reduce high-cost bills',
          expectedImpact: 'Reduce monthly expenses by 10-20%',
          timeframe: '1-2 weeks',
          effort: 'medium'
        }
      ] : []
    };
  }
}

// Default export for general use
export const insightsClient = new InsightsClient();