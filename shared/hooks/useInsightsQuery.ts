/**
 * Insights React Query Hooks
 * Server state management for business intelligence and insights
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { insightsClient, type InsightsRequest, type InsightsResponse, type BusinessIntelligence, type UsageStats } from '../api/clients/insightsClient';
import { logger } from '../lib';

// Query keys for consistent caching
export const insightsKeys = {
  all: ['insights'] as const,
  backendInsights: (request: InsightsRequest) => ['insights', 'backend', request] as const,
  businessIntelligence: (userId?: string, dataHash?: string) => ['insights', 'business', userId, dataHash] as const,
  usageStats: (userId?: string) => ['insights', 'usage', userId] as const,
} as const;

// Options for queries
const defaultQueryOptions = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes
  retry: (failureCount: number, error: any) => {
    // Don't retry on authentication errors
    if (error?.status === 401 || error?.status === 403) {
      return false;
    }
    // Retry up to 2 times for other errors
    return failureCount < 2;
  },
};

/**
 * Hook to get AI-powered financial insights from backend
 */
export function useBackendInsights(
  request: InsightsRequest,
  options: {
    enabled?: boolean;
    userId?: string;
  } = {}
) {
  const { enabled = true, userId } = options;

  return useQuery({
    queryKey: insightsKeys.backendInsights(request),
    queryFn: async () => {
      logger.info('Fetching backend insights', { 
        monthly_income: request.monthly_income,
        monthly_expenses: request.monthly_expenses,
        userId 
      });

      const insights = await insightsClient.getInsights(request);
      
      logger.info('Backend insights received', { 
        tier_unlocked: insights.tier_unlocked,
        confidence_score: insights.confidence_score,
        userId 
      });

      return insights;
    },
    enabled: enabled && request.monthly_income > 0 && request.monthly_expenses > 0,
    ...defaultQueryOptions,
    meta: {
      errorMessage: 'Failed to load AI insights from server',
    },
  });
}

/**
 * Hook to get comprehensive business intelligence analysis
 */
export function useBusinessIntelligence(
  data: {
    bills: any[];
    currentBudget: number | null;
    monthlyTotal: number;
    budgetBreakdown: any;
    profile: any;
    totalHouseholdIncome: number;
  },
  options: {
    enabled?: boolean;
    userId?: string;
  } = {}
) {
  const { enabled = true, userId } = options;

  // Create a hash of the data to use for caching
  const dataHash = JSON.stringify({
    billsCount: data.bills.length,
    billsTotal: data.bills.reduce((sum, bill) => sum + bill.amount, 0),
    currentBudget: data.currentBudget,
    monthlyTotal: data.monthlyTotal,
    income: data.totalHouseholdIncome,
    profileId: data.profile?.id,
  });

  return useQuery({
    queryKey: insightsKeys.businessIntelligence(userId, dataHash),
    queryFn: async () => {
      logger.info('Generating business intelligence', { 
        billsCount: data.bills.length,
        budget: data.currentBudget,
        income: data.totalHouseholdIncome,
        userId 
      });

      const intelligence = await insightsClient.getBusinessIntelligence(data);
      
      logger.info('Business intelligence generated', { 
        keyFindingsCount: intelligence.keyFindings.length,
        prioritiesCount: intelligence.actionablePriorities.length,
        userId 
      });

      return intelligence;
    },
    enabled: enabled && data.bills.length > 0,
    ...defaultQueryOptions,
    staleTime: 10 * 60 * 1000, // 10 minutes for business intelligence
    meta: {
      errorMessage: 'Failed to generate business intelligence',
    },
  });
}

/**
 * Hook to get user's AI usage statistics
 */
export function useUsageStats(
  options: {
    enabled?: boolean;
    userId?: string;
  } = {}
) {
  const { enabled = true, userId } = options;

  return useQuery({
    queryKey: insightsKeys.usageStats(userId),
    queryFn: async () => {
      logger.info('Fetching usage statistics', { userId });

      const stats = await insightsClient.getUsageStats();
      
      logger.info('Usage statistics received', { 
        tier: stats.tier,
        chat_usage: stats.chat_usage_today,
        insights_usage: stats.insights_usage_month,
        userId 
      });

      return stats;
    },
    enabled,
    ...defaultQueryOptions,
    staleTime: 2 * 60 * 1000, // 2 minutes for usage stats
    meta: {
      errorMessage: 'Failed to load usage statistics',
    },
  });
}

/**
 * Mutation to refresh insights data
 */
export function useRefreshInsights() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params?: { userId?: string }) => {
      logger.info('Refreshing insights data', { userId: params?.userId });
      
      // Invalidate all insights queries
      await queryClient.invalidateQueries({
        queryKey: insightsKeys.all,
      });

      return { success: true, timestamp: new Date().toISOString() };
    },
    onSuccess: (data, variables) => {
      logger.info('Insights data refreshed successfully', { 
        timestamp: data.timestamp,
        userId: variables?.userId 
      });
    },
    onError: (error, variables) => {
      logger.error('Failed to refresh insights data', error, { 
        userId: variables?.userId 
      });
    },
  });
}

/**
 * Hook to prefetch business intelligence for better UX
 */
export function usePrefetchBusinessIntelligence() {
  const queryClient = useQueryClient();

  return {
    prefetch: async (
      data: {
        bills: any[];
        currentBudget: number | null;
        monthlyTotal: number;
        budgetBreakdown: any;
        profile: any;
        totalHouseholdIncome: number;
      },
      userId?: string
    ) => {
      const dataHash = JSON.stringify({
        billsCount: data.bills.length,
        billsTotal: data.bills.reduce((sum, bill) => sum + bill.amount, 0),
        currentBudget: data.currentBudget,
        monthlyTotal: data.monthlyTotal,
        income: data.totalHouseholdIncome,
        profileId: data.profile?.id,
      });

      await queryClient.prefetchQuery({
        queryKey: insightsKeys.businessIntelligence(userId, dataHash),
        queryFn: () => insightsClient.getBusinessIntelligence(data),
        ...defaultQueryOptions,
      });

      logger.info('Business intelligence prefetched', { 
        billsCount: data.bills.length,
        userId 
      });
    },
  };
}

/**
 * Hook to get cached insights data without triggering new requests
 */
export function useCachedInsights(userId?: string) {
  const queryClient = useQueryClient();

  return {
    getBusinessIntelligence: (dataHash: string): BusinessIntelligence | undefined => {
      return queryClient.getQueryData(insightsKeys.businessIntelligence(userId, dataHash));
    },
    getUsageStats: (): UsageStats | undefined => {
      return queryClient.getQueryData(insightsKeys.usageStats(userId));
    },
    getAllCachedInsights: () => {
      return queryClient.getQueriesData({
        queryKey: insightsKeys.all,
      });
    },
  };
}