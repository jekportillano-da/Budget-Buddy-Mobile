/*
 * MIT License
 * Copyright (c) 2024 Budget Buddy Mobile
 * 
 * AI-powered insights and financial analysis dashboard
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useBudgetStore } from '../../stores/budgetStore';
import { useBillsStore } from '../../stores/billsStore';
import { useUserStore } from '../../stores/userStore';
import { grokAIService } from '../../services/grokAIService';
import { logger } from '../../utils/logger';
import { formatCurrency } from '../../utils/currencyUtils';

// Financial news fetching function
const fetchPhilippineFinancialNews = async () => {
  try {
    // For demo purposes, I'll return simulated recent financial news for Philippines
    // In a real app, you'd integrate with news APIs like NewsAPI, Rappler API, etc.
    const mockNews = [
      {
        id: 1,
        title: "Petron raises gasoline prices by ₱0.90 per liter",
        summary: "Oil prices increase due to Middle East tensions affecting global supply",
        impact: "Transportation and delivery costs expected to rise",
        source: "Philippine Star",
        url: "https://www.philstar.com/business/2024/09/04/petron-raises-gas-prices",
        date: "2024-09-04",
        category: "fuel",
        icon: "⛽"
      },
      {
        id: 2,
        title: "Meralco announces 15% electricity rate hike for September",
        summary: "Higher generation charges and increased coal prices drive rate increase",
        impact: "Average household bills to increase by ₱200-₱400 monthly",
        source: "Manila Bulletin",
        url: "https://mb.com.ph/2024/09/03/meralco-electricity-rate-hike-september",
        date: "2024-09-03",
        category: "utilities",
        icon: "⚡"
      },
      {
        id: 3,
        title: "BSP keeps interest rates steady at 6.5%",
        summary: "Central bank maintains policy rate amid controlled inflation",
        impact: "Loan rates and savings account yields remain stable",
        source: "Business World",
        url: "https://www.bworldonline.com/economy/2024/09/02/bsp-interest-rates-steady",
        date: "2024-09-02",
        category: "banking",
        icon: "🏦"
      },
      {
        id: 4,
        title: "Food prices rise 3.2% as typhoon affects agriculture",
        summary: "Recent weather disturbances impact rice and vegetable supply",
        impact: "Grocery budgets may need 5-10% adjustment for coming months",
        source: "Rappler",
        url: "https://www.rappler.com/business/food-prices-increase-typhoon-agriculture",
        date: "2024-09-01",
        category: "food",
        icon: "🌾"
      }
    ];

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return mockNews;
  } catch (error) {
    logger.error('Error fetching financial news', { error });
    return [];
  }
};

export default function Insights() {
  const [refreshing, setRefreshing] = useState(false);
  const [businessIntelligence, setBusinessIntelligence] = useState<any>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [financialNews, setFinancialNews] = useState<any[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [aiBreakdown, setAiBreakdown] = useState<any>(null);

  const { currentBudget, breakdown } = useBudgetStore();
  const { bills, monthlyTotal } = useBillsStore();
  const { profile, totalHouseholdIncome } = useUserStore();

  // Load comprehensive business intelligence insights
  const loadBusinessIntelligence = async () => {
    setIsLoadingInsights(true);
    try {
      logger.debug('Calling Grok AI service', { billsCount: bills.length, budget: currentBudget });
      
      // First, try to get or generate the AI breakdown with entertainment/miscellaneous
      if (currentBudget && !aiBreakdown) {
        logger.debug('Generating AI breakdown with entertainment/miscellaneous');
        const smartBreakdown = await grokAIService.generateSmartBudgetBreakdown(currentBudget);
        setAiBreakdown(smartBreakdown);
      }
      
      // Calculate actual spending (needs only) for Executive Summary - same logic as Budget vs Current
      let actualSpending = monthlyTotal;
      
      if (aiBreakdown?.categories) {
        const billsByCategory = bills.reduce((acc, bill) => {
          acc[bill.category] = (acc[bill.category] || 0) + bill.amount;
          return acc;
        }, {} as Record<string, number>);
        
        // Only count "needs" categories as actual spending - EXACT same logic as Budget vs Current
        actualSpending = Object.entries(aiBreakdown.categories).reduce((total, [category, budgetAmount]) => {
          // Only include needs categories in actual spending calculation
          if (['food/groceries', 'food', 'utilities', 'rent', 'transportation', 'healthcare', 'insurance'].includes(category)) {
            const actualAmount = billsByCategory[category] || Number(budgetAmount); // Use actual if available, else budget
            if (__DEV__) {
              logger.debug(`Executive Summary - ${category}`, { 
                actualAmount, 
                type: billsByCategory[category] ? 'actual' : 'budget' 
              });
            }
            return total + actualAmount;
          }
          return total;
        }, 0);
        
        if (__DEV__) {
          logger.debug('Total actual spending (needs only) for Executive Summary', { actualSpending });
        }
      }
      
      // Pass the component's complete data including profile and budget breakdown
      const insights = await grokAIService.generatePersonalizedBusinessIntelligence({
        bills,
        currentBudget,
        monthlyTotal: actualSpending, // Use actual spending (needs only) instead of total budget
        budgetBreakdown: aiBreakdown?.categories || breakdown,
        profile,
        totalHouseholdIncome
      });
      logger.debug('AI Response received', { insights });
      setBusinessIntelligence(insights);
    } catch (error) {
      console.warn('Failed to load business intelligence:', error);
      // Fallback: Create basic insights with available data
      if (bills.length > 0 && currentBudget) {
        const basicInsights = createBasicInsights();
        setBusinessIntelligence(basicInsights);
      }
    } finally {
      setIsLoadingInsights(false);
    }
  };

  // Create basic insights when AI service fails
  const createBasicInsights = () => {
    const utilizationPercent = ((monthlyTotal / (currentBudget || 1)) * 100);
    const utilizationStatus = utilizationPercent > 80 ? 'warning' : utilizationPercent > 60 ? 'good' : 'excellent';
    
    return {
      executiveSummary: `Your monthly spending of ₱${monthlyTotal.toLocaleString()} represents ${utilizationPercent.toFixed(1)}% of your ₱${currentBudget?.toLocaleString()} budget. ${utilizationPercent < 50 ? 'You have excellent budget utilization with room for additional savings.' : utilizationPercent < 80 ? 'You have good budget management with moderate spending levels.' : 'Consider reviewing your expenses to optimize spending.'}`,
      keyFindings: [
        {
          metric: 'Budget Utilization',
          value: `${utilizationPercent.toFixed(1)}%`,
          benchmark: '< 80% (recommended)',
          status: utilizationStatus,
          reasoning: `Your spending represents ${utilizationPercent.toFixed(1)}% of your total budget, ${utilizationPercent < 80 ? 'which is within healthy limits' : 'which may require attention'}.`,
          recommendation: utilizationPercent < 50 ? 'Consider increasing your savings rate or investing in emergency funds.' : utilizationPercent < 80 ? 'Maintain current spending patterns and look for optimization opportunities.' : 'Review and reduce non-essential expenses to improve financial health.'
        }
      ],
      spendingEfficiencyAnalysis: { overallRating: utilizationStatus, inefficiencies: [] },
      forecastAndProjections: { 
        monthlyTrend: 'Stable', 
        yearEndProjection: `₱${(monthlyTotal * 12).toLocaleString()}`, 
        savingsPotential: Math.max(0, (currentBudget || 0) - monthlyTotal) * 12,
        riskFactors: [] 
      },
      benchmarkComparison: { 
        vsPeers: utilizationPercent < 70 ? 'Above average' : 'Average', 
        vsOptimal: utilizationStatus, 
        ranking: utilizationPercent < 50 ? 'Top 25%' : utilizationPercent < 80 ? 'Top 50%' : 'Needs improvement' 
      },
      actionablePriorities: []
    };
  };

  useEffect(() => {
    if (__DEV__) {
      logger.debug('Insights Debug', {
        billsCount: bills.length,
        budget: currentBudget,
        billsData: bills,
        monthlyTotal,
        breakdown,
        profile,
        totalHouseholdIncome
      });
    }
    
    if (bills.length > 0 || currentBudget) {
      logger.debug('Loading business intelligence');
      loadBusinessIntelligence();
    } else {
      logger.debug('No data available for insights');
    }
    
    // Load financial news
    loadFinancialNews();
  }, [bills.length, currentBudget, breakdown, profile]);

  const loadFinancialNews = async () => {
    setNewsLoading(true);
    try {
      const news = await fetchPhilippineFinancialNews();
      setFinancialNews(news);
    } catch (error) {
      logger.error('Failed to load financial news', { error });
    } finally {
      setNewsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadBusinessIntelligence(),
      loadFinancialNews()
    ]);
    setRefreshing(false);
  };

  // Helper function to get status colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return '#4CAF50';
      case 'good': return '#8BC34A';
      case 'warning': return '#FF9800';
      case 'critical': return '#F44336';
      default: return '#666';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing || isLoadingInsights} onRefresh={onRefresh} />
        }
      >
        {isLoadingInsights ? (
          <View style={styles.loadingState}>
            <Text style={styles.loadingTitle}>🔄 Analyzing Your Financial Data...</Text>
            <Text style={styles.loadingDescription}>
              Our AI is generating comprehensive business intelligence based on your spending patterns...
            </Text>
          </View>
        ) : businessIntelligence ? (
          <>
            {/* Executive Summary */}
            <View style={styles.summaryCard}>
              <Text style={styles.sectionTitle}>📊 Executive Summary</Text>
              <Text style={styles.summaryText}>{businessIntelligence.executiveSummary}</Text>
            </View>

            {/* Key Financial Metrics */}
            {businessIntelligence.keyFindings?.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🎯 Key Financial Metrics</Text>
                {businessIntelligence.keyFindings.map((finding: any, index: number) => (
                  <View key={index} style={[styles.metricCard, { borderLeftColor: getStatusColor(finding.status) }]}>
                    <View style={styles.metricHeader}>
                      <Text style={styles.metricName}>{finding.metric}</Text>
                      <Text style={[styles.metricValue, { color: getStatusColor(finding.status) }]}>
                        {finding.value}
                      </Text>
                    </View>
                    <Text style={styles.benchmark}>Benchmark: {finding.benchmark}</Text>
                    <Text style={styles.reasoning}>{finding.reasoning}</Text>
                    <View style={styles.recommendationContainer}>
                      <Text style={styles.recommendationLabel}>💡 Recommendation:</Text>
                      <Text style={styles.recommendation}>{finding.recommendation}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Basic Financial Overview when no detailed metrics */}
            {(!businessIntelligence.keyFindings || businessIntelligence.keyFindings.length === 0) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>💰 Financial Overview</Text>
                <View style={styles.overviewCard}>
                  <View style={styles.overviewItem}>
                    <Text style={styles.overviewLabel}>Monthly Bills</Text>
                    <Text style={styles.overviewValue}>₱{monthlyTotal.toLocaleString()}</Text>
                  </View>
                  <View style={styles.overviewItem}>
                    <Text style={styles.overviewLabel}>Current Budget</Text>
                    <Text style={styles.overviewValue}>₱{currentBudget?.toLocaleString() || '0'}</Text>
                  </View>
                  <View style={styles.overviewItem}>
                    <Text style={styles.overviewLabel}>Budget Utilization</Text>
                    <Text style={[styles.overviewValue, { color: monthlyTotal > (currentBudget || 0) ? '#F44336' : '#4CAF50' }]}>
                      {((monthlyTotal / (currentBudget || 1)) * 100).toFixed(1)}%
                    </Text>
                  </View>
                </View>
                
                <View style={styles.summaryCard}>
                  <Text style={styles.sectionTitle}>🤖 AI Analysis Status</Text>
                  <Text style={styles.summaryText}>
                    {businessIntelligence.executiveSummary}
                  </Text>
                  
                  <View style={styles.configWarning}>
                    <Text style={styles.configWarningText}>
                      💡 For detailed AI-powered business intelligence insights, configure your Grok API key in the environment settings.
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Recommended Budget vs Current Status */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📊 Budget Recommendations vs Current Status</Text>
              {/* Budget Comparison Component */}
              <View style={styles.budgetComparisonCard}>
                {(() => {
                  const income = totalHouseholdIncome || 135400;
                  const currentSpending = monthlyTotal;
                  const currentBudgetAmount = currentBudget || 0;
                  
                  // Calculate 50/30/20 recommendations
                  const recommendedNeeds = income * 0.6; // 60% for needs
                  const recommendedWants = income * 0.25; // 25% for wants  
                  const recommendedSavings = income * 0.15; // 15% for savings
                  
                  // Calculate current allocation by properly categorizing budget breakdown
                  let currentNeeds = 0;
                  let currentWants = 0;
                  let currentSavings = 0;
                  
                  // Use AI breakdown if available (includes entertainment/miscellaneous), otherwise fallback to basic breakdown
                  const budgetToUse = aiBreakdown?.categories || breakdown?.categories;
                  
                  if (budgetToUse) {
                    if (__DEV__) {
                      logger.debug('Budget categories available', { categories: Object.keys(budgetToUse) });
                    }
                    
                    // Group bills by category first
                    const billsByCategory = bills.reduce((acc, bill) => {
                      acc[bill.category] = (acc[bill.category] || 0) + bill.amount;
                      return acc;
                    }, {} as Record<string, number>);
                    
                    // Map budget breakdown to needs/wants/savings
                    Object.entries(budgetToUse).forEach(([category, budgetAmount]) => {
                      const actualAmount = billsByCategory[category] || Number(budgetAmount); // Use actual if available, else budget
                      
                      if (__DEV__) {
                        logger.debug(`Categorizing ${category}`, { 
                          actualAmount, 
                          type: billsByCategory[category] ? 'actual' : 'budget' 
                        });
                      }
                      
                      // Categorize into needs, wants, savings
                      if (['food/groceries', 'food', 'utilities', 'rent', 'transportation', 'healthcare', 'insurance'].includes(category)) {
                        currentNeeds += actualAmount;
                        if (__DEV__) {
                          logger.debug('Added to NEEDS', { actualAmount });
                        }
                      } else if (['entertainment', 'dining', 'shopping', 'hobbies', 'miscellaneous', 'education'].includes(category)) {
                        currentWants += actualAmount;
                        if (__DEV__) {
                          logger.debug('Added to WANTS', { actualAmount });
                        }
                      } else if (['emergency_fund', 'savings', 'investments'].includes(category)) {
                        currentSavings += actualAmount;
                        if (__DEV__) {
                          logger.debug('Added to SAVINGS', { actualAmount });
                        }
                      }
                    });
                    
                    if (__DEV__) {
                      logger.debug('Total allocations', {
                        needs: currentNeeds,
                        wants: currentWants,
                        savings: currentSavings
                      });
                    }
                  } else {
                    // Fallback to simple calculation if no breakdown available
                    currentNeeds = currentSpending;
                    currentSavings = Math.max(0, income - currentBudgetAmount);
                  }
                  
                  const categories = [
                    {
                      name: 'Needs',
                      description: 'Food/groceries, utilities, rent, transportation, healthcare, insurance',
                      recommended: recommendedNeeds,
                      current: currentNeeds,
                      percentage: 60,
                      color: '#4CAF50',
                      icon: '🏠'
                    },
                    {
                      name: 'Wants', 
                      description: 'Entertainment, dining out, shopping, hobbies, miscellaneous/discretionary',
                      recommended: recommendedWants,
                      current: currentWants,
                      percentage: 25,
                      color: '#FF9800',
                      icon: '🎯'
                    },
                    {
                      name: 'Savings',
                      description: 'Emergency fund, investments, retirement savings',
                      recommended: recommendedSavings,
                      current: currentSavings,
                      percentage: 15,
                      color: '#2196F3',
                      icon: '💰'
                    }
                  ];

                  return categories.map((category, index) => {
                    const currentPercentage = (category.current / category.recommended) * 100;
                    const isOverBudget = currentPercentage > 120;
                    const isUnderUtilized = currentPercentage < 50;
                    
                    return (
                      <View key={index} style={styles.categoryComparisonItem}>
                        <View style={styles.categoryHeader}>
                          <View style={styles.categoryTitleRow}>
                            <Text style={styles.categoryIcon}>{category.icon}</Text>
                            <View style={styles.categoryInfo}>
                              <Text style={styles.categoryName}>{category.name} ({category.percentage}%)</Text>
                              <Text style={styles.categoryDescription}>{category.description}</Text>
                            </View>
                          </View>
                          <View style={styles.categoryAmounts}>
                            <Text style={styles.recommendedAmount}>₱{category.recommended.toLocaleString()}</Text>
                            <Text style={[styles.currentAmount, { 
                              color: isOverBudget ? '#F44336' : isUnderUtilized ? '#FF9800' : '#4CAF50' 
                            }]}>
                              ₱{category.current.toLocaleString()} current
                            </Text>
                          </View>
                        </View>
                        
                        {/* Progress bar with current position indicator */}
                        <View style={styles.progressBarContainer}>
                          <View style={[styles.progressBarTrack, { backgroundColor: `${category.color}20` }]}>
                            <View 
                              style={[
                                styles.progressBarFill, 
                                { 
                                  backgroundColor: category.color,
                                  width: '100%' // Full bar represents the recommendation
                                }
                              ]} 
                            />
                            {/* Current position indicator - enhanced visibility */}
                            <View 
                              style={[
                                styles.currentPositionIndicator,
                                {
                                  left: `${Math.min(currentPercentage, 200)}%`, // Cap at 200% to keep on screen
                                  backgroundColor: isOverBudget ? '#F44336' : '#FFF',
                                  borderColor: isOverBudget ? '#F44336' : '#333',
                                  borderWidth: 3,
                                  shadowColor: '#000',
                                  shadowOffset: { width: 0, height: 2 },
                                  shadowOpacity: 0.3,
                                  shadowRadius: 4,
                                  elevation: 5,
                                }
                              ]}
                            >
                              <View style={[styles.indicatorDot, { 
                                backgroundColor: isOverBudget ? '#FFF' : '#333' 
                              }]} />
                              {/* Arrow pointing down to the bar */}
                              <View style={[styles.indicatorArrow, {
                                borderTopColor: isOverBudget ? '#F44336' : '#333'
                              }]} />
                            </View>
                            {/* Current position label */}
                            <View style={[styles.currentPositionLabel, {
                              left: `${Math.min(currentPercentage, 180)}%`, // Slightly offset to avoid overlap
                            }]}>
                              <Text style={styles.currentPositionText}>
                                {currentPercentage.toFixed(0)}%
                              </Text>
                            </View>
                          </View>
                          
                          <View style={styles.progressLabels}>
                            <Text style={styles.progressLabel}>₱0</Text>
                            <Text style={[styles.progressLabel, { color: category.color }]}>
                              ₱{category.recommended.toLocaleString()} recommended
                            </Text>
                          </View>
                        </View>
                        
                        {/* Status and recommendation */}
                        <View style={styles.categoryStatusContainer}>
                          <Text style={[styles.categoryStatus, {
                            color: isOverBudget ? '#F44336' : isUnderUtilized ? '#FF9800' : '#4CAF50'
                          }]}>
                            {isOverBudget ? '⚠️ Over recommended' : 
                             isUnderUtilized ? '📈 Under-utilized' : 
                             '✅ Well balanced'}
                          </Text>
                          <Text style={styles.categoryGap}>
                            {category.current > category.recommended ? 
                              `₱${(category.current - category.recommended).toLocaleString()} over` :
                              `₱${(category.recommended - category.current).toLocaleString()} available`
                            }
                          </Text>
                        </View>
                      </View>
                    );
                  });
                })()}
              </View>
            </View>

            {/* NCR Insights */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🏙️ NCR Financial Insights</Text>
              <View style={styles.ncrInsightsCard}>
                <View style={styles.insightItem}>
                  <Text style={styles.insightLabel}>Minimum Wage</Text>
                  <Text style={styles.insightValue}>₱645/day</Text>
                </View>
                <View style={styles.insightItem}>
                  <Text style={styles.insightLabel}>Average Utilities</Text>
                  <Text style={styles.insightValue}>₱3,500.00-₱5,000.00</Text>
                </View>
                <View style={styles.insightItem}>
                  <Text style={styles.insightLabel}>Average Rent</Text>
                  <Text style={styles.insightValue}>₱15,000.00-₱35,000.00</Text>
                </View>
                
                <View style={styles.ncrRecommendation}>
                  <Text style={styles.ncrRecommendationText}>
                    💡 Based on your location, consider budgeting ₱5,000.00 for utilities and ₱15,000.00 for food monthly.
                  </Text>
                </View>

                {/* Latest Financial News */}
                <View style={styles.newsSection}>
                  <Text style={styles.newsSectionTitle}>📰 Latest Financial News</Text>
                  {newsLoading ? (
                    <View style={styles.newsLoading}>
                      <Text style={styles.newsLoadingText}>Loading latest updates...</Text>
                    </View>
                  ) : (
                    <View style={styles.newsList}>
                      {financialNews.slice(0, 3).map((newsItem, index) => (
                        <TouchableOpacity
                          key={newsItem.id}
                          style={styles.newsItem}
                          onPress={() => Linking.openURL(newsItem.url)}
                        >
                          <View style={styles.newsHeader}>
                            <Text style={styles.newsIcon}>{newsItem.icon}</Text>
                            <View style={styles.newsContent}>
                              <Text style={styles.newsTitle} numberOfLines={2}>
                                {newsItem.title}
                              </Text>
                              <Text style={styles.newsDate}>{newsItem.date} • {newsItem.source}</Text>
                            </View>
                          </View>
                          <Text style={styles.newsSummary} numberOfLines={2}>
                            {newsItem.summary}
                          </Text>
                          <View style={styles.newsImpact}>
                            <Text style={styles.newsImpactLabel}>Impact:</Text>
                            <Text style={styles.newsImpactText}>{newsItem.impact}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>🚀 Business Intelligence Insights</Text>
            <Text style={styles.emptyDescription}>
              Add your bills and set up a budget to unlock powerful business intelligence insights that will help you optimize your finances like a pro.
            </Text>
            {bills.length === 0 && (
              <TouchableOpacity style={styles.getStartedButton}>
                <Text style={styles.getStartedText}>Get Started</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  loadingDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
  },
  section: {
    marginBottom: 16,
  },
  metricCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  benchmark: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  reasoning: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 12,
  },
  recommendationContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  recommendationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  recommendation: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  getStartedButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  getStartedText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  overviewCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  overviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  overviewLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  overviewValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'right',
  },
  configWarning: {
    backgroundColor: '#fff3cd',
    borderRadius: 6,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#ffc107',
  },
  configWarningText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  // Budget Comparison Styles
  budgetComparisonCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryComparisonItem: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  categoryAmounts: {
    alignItems: 'flex-end',
  },
  recommendedAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 2,
  },
  currentAmount: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    position: 'relative',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  currentPositionIndicator: {
    position: 'absolute',
    top: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
    zIndex: 10,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  indicatorArrow: {
    position: 'absolute',
    top: 14,
    left: 5,
    width: 0,
    height: 0,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderTopWidth: 4,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  currentPositionLabel: {
    position: 'absolute',
    top: -30,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: -15,
    zIndex: 5,
  },
  currentPositionText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
  },
  categoryStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryGap: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  // NCR Insights Styles
  ncrInsightsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  insightLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  insightValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'right',
  },
  ncrRecommendation: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#2196f3',
  },
  ncrRecommendationText: {
    fontSize: 14,
    color: '#1565c0',
    lineHeight: 20,
  },
  // News Section Styles
  newsSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  newsSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  newsLoading: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  newsLoadingText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  newsList: {
    gap: 12,
  },
  newsItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#2196f3',
  },
  newsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  newsIcon: {
    fontSize: 20,
    marginRight: 10,
    marginTop: 2,
  },
  newsContent: {
    flex: 1,
  },
  newsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    lineHeight: 18,
    marginBottom: 4,
  },
  newsDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  newsSummary: {
    fontSize: 13,
    color: '#555',
    lineHeight: 17,
    marginBottom: 8,
  },
  newsImpact: {
    backgroundColor: '#fff3cd',
    borderRadius: 4,
    padding: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#ffc107',
  },
  newsImpactLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 2,
  },
  newsImpactText: {
    fontSize: 12,
    color: '#856404',
    lineHeight: 16,
  },
});
