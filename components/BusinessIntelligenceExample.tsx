/**
 * Business Intelligence Hook Example
 * Demonstrates React Query integration for insights
 */

import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { useBusinessIntelligence, useUsageStats, useRefreshInsights } from '../shared/hooks/useInsightsQuery';
import { useBudgetStore } from '../stores/budgetStore';
import { useBillsStore } from '../stores/billsStore';
import { useUserStore } from '../stores/userStore';

interface BusinessIntelligenceExampleProps {
  userId?: string;
}

export const BusinessIntelligenceExample: React.FC<BusinessIntelligenceExampleProps> = ({ userId }) => {
  // Get data from stores
  const { currentBudget, breakdown } = useBudgetStore();
  const { bills, monthlyTotal } = useBillsStore();
  const { profile, totalHouseholdIncome } = useUserStore();

  // Use React Query hooks
  const { 
    data: businessIntelligence, 
    isLoading: isLoadingBI, 
    error: biError,
    refetch: refetchBI
  } = useBusinessIntelligence({
    bills,
    currentBudget,
    monthlyTotal,
    budgetBreakdown: breakdown,
    profile,
    totalHouseholdIncome,
  }, {
    enabled: bills.length > 0,
    userId,
  });

  const { 
    data: usageStats, 
    isLoading: isLoadingUsage,
    error: usageError
  } = useUsageStats({
    userId,
  });

  const refreshInsights = useRefreshInsights();

  const handleRefresh = async () => {
    try {
      await refreshInsights.mutateAsync({ userId });
      await refetchBI();
    } catch (error) {
      console.error('Failed to refresh insights:', error);
    }
  };

  if (isLoadingBI) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Generating Business Intelligence...</Text>
      </View>
    );
  }

  if (biError) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Failed to load insights</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetchBI()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Business Intelligence</Text>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={handleRefresh}
          disabled={refreshInsights.isPending}
        >
          <Text style={styles.refreshButtonText}>
            {refreshInsights.isPending ? 'Refreshing...' : 'Refresh'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Usage Stats */}
      {usageStats && (
        <View style={styles.usageCard}>
          <Text style={styles.sectionTitle}>Usage Statistics</Text>
          <Text style={styles.usageText}>Tier: {usageStats.tier}</Text>
          <Text style={styles.usageText}>
            Insights this month: {usageStats.insights_usage_month} / {usageStats.insights_limit_monthly}
          </Text>
          <Text style={styles.usageText}>
            Chat today: {usageStats.chat_usage_today} / {usageStats.chat_limit_daily}
          </Text>
        </View>
      )}

      {/* Executive Summary */}
      {businessIntelligence && (
        <View style={styles.insightsCard}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          <Text style={styles.summaryText}>{businessIntelligence.executiveSummary}</Text>

          {/* Key Findings */}
          <Text style={styles.sectionTitle}>Key Findings</Text>
          {businessIntelligence.keyFindings.map((finding, index) => (
            <View key={index} style={styles.findingCard}>
              <View style={styles.findingHeader}>
                <Text style={styles.findingMetric}>{finding.metric}</Text>
                <Text style={[
                  styles.findingStatus,
                  finding.status === 'critical' && styles.statusCritical,
                  finding.status === 'warning' && styles.statusWarning,
                  finding.status === 'good' && styles.statusGood,
                  finding.status === 'excellent' && styles.statusExcellent,
                ]}>
                  {finding.status.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.findingValue}>{finding.value}</Text>
              <Text style={styles.findingBenchmark}>Benchmark: {finding.benchmark}</Text>
              <Text style={styles.findingRecommendation}>{finding.recommendation}</Text>
            </View>
          ))}

          {/* Action Priorities */}
          {businessIntelligence.actionablePriorities.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Action Priorities</Text>
              {businessIntelligence.actionablePriorities.map((priority, index) => (
                <View key={index} style={styles.priorityCard}>
                  <View style={styles.priorityHeader}>
                    <Text style={styles.priorityNumber}>#{priority.priority}</Text>
                    <Text style={[
                      styles.priorityEffort,
                      priority.effort === 'low' && styles.effortLow,
                      priority.effort === 'medium' && styles.effortMedium,
                      priority.effort === 'high' && styles.effortHigh,
                    ]}>
                      {priority.effort.toUpperCase()} EFFORT
                    </Text>
                  </View>
                  <Text style={styles.priorityAction}>{priority.action}</Text>
                  <Text style={styles.priorityImpact}>Impact: {priority.expectedImpact}</Text>
                  <Text style={styles.priorityTimeframe}>Timeframe: {priority.timeframe}</Text>
                </View>
              ))}
            </>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  usageCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightsCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    marginTop: 8,
  },
  usageText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 16,
  },
  findingCard: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  findingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  findingMetric: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  findingStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusCritical: {
    backgroundColor: '#FF3B30',
    color: 'white',
  },
  statusWarning: {
    backgroundColor: '#FF9500',
    color: 'white',
  },
  statusGood: {
    backgroundColor: '#34C759',
    color: 'white',
  },
  statusExcellent: {
    backgroundColor: '#007AFF',
    color: 'white',
  },
  findingValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  findingBenchmark: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  findingRecommendation: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
  },
  priorityCard: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  priorityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  priorityEffort: {
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
  },
  effortLow: {
    backgroundColor: '#34C759',
    color: 'white',
  },
  effortMedium: {
    backgroundColor: '#FF9500',
    color: 'white',
  },
  effortHigh: {
    backgroundColor: '#FF3B30',
    color: 'white',
  },
  priorityAction: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  priorityImpact: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  priorityTimeframe: {
    fontSize: 14,
    color: '#666',
  },
});

export default BusinessIntelligenceExample;