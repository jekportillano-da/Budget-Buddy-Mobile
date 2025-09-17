import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useBudgetStore } from '../../stores/budgetStore';
import { useBillsStore } from '../../stores/billsStore';
import { useAuthStore } from '../../stores/authStore';
import { cohereAIService } from '../../services/cohereAIService';
import BudgetChart from '../../components/BudgetChart';
import { formatCurrency } from '../../utils/currencyUtils';
import { useTheme } from '../../contexts/ThemeContext';
import AnimatedButton from '../../components/AnimatedButton';
import AnimatedLoading from '../../components/AnimatedLoading';
import AnimatedButtonSimple from '../../components/AnimatedButtonSimple';
import AnimatedContainer from '../../components/AnimatedContainer';
import AIChatbot from '../../components/AIChatbot';

export default function Dashboard() {
  const [budgetAmount, setBudgetAmount] = useState('');
  const [duration, setDuration] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [aiBreakdown, setAiBreakdown] = useState<any>(null);
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  
  const theme = useTheme();
  
  const { 
    currentBudget, 
    breakdown, 
    isLoading, 
    calculateBudget,
    getSavingsForecast,
    getInsights 
  } = useBudgetStore();

  // Get auth data
  const { user, logout } = useAuthStore();

  // Get bills data
  const { bills, monthlyTotal } = useBillsStore();

  // Logout handler
  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/');
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  // Create combined breakdown using actual bills data
  const createActualBreakdown = () => {
    if (bills.length === 0) return null;

    // Group bills by category
    const billsByCategory = bills.reduce((acc, bill) => {
      acc[bill.category] = (acc[bill.category] || 0) + bill.amount;
      return acc;
    }, {} as Record<string, number>);

    // Add missing essential categories with zero amounts
    const essentialCategories = ['food/groceries', 'food', 'transportation', 'utilities', 'rent', 'healthcare'];
    essentialCategories.forEach(category => {
      if (!billsByCategory[category]) {
        billsByCategory[category] = 0;
      }
    });

    const totalEssential = Object.values(billsByCategory).reduce((sum, amount) => sum + amount, 0);
    const estimatedSavings = breakdown ? breakdown.total_savings : 0;

    return {
      categories: billsByCategory,
      total_essential: totalEssential,
      total_savings: estimatedSavings,
    };
  };

  const actualBreakdown = createActualBreakdown();

  const handleCalculate = async () => {
    if (!budgetAmount || parseFloat(budgetAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid budget amount');
      return;
    }

    try {
      setIsGeneratingAI(true);
      
      // Calculate basic budget breakdown
      await calculateBudget(parseFloat(budgetAmount), duration);
      
      // Generate AI-powered comprehensive breakdown
      const smartBreakdown = await cohereAIService.generateSmartBudgetBreakdown(parseFloat(budgetAmount));
      setAiBreakdown(smartBreakdown);
      setAiRecommendations(smartBreakdown.aiRecommendations);
      
    } catch (error) {
      Alert.alert('Error', 'Failed to calculate budget. Please try again.');
      console.error('Budget calculation error:', error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return (
    <>
      <ScrollView style={[styles.container, { backgroundColor: theme.currentTheme.colors.background }]}>
        {/* User header with logout */}
        {user && (
          <AnimatedContainer delay={0} style={styles.headerContainer}>
            <View style={[styles.headerSection, { backgroundColor: theme.currentTheme.colors.surface }]}>
              <Text style={[styles.welcomeText, { color: theme.currentTheme.colors.text }]}>
                Welcome, {user.name}!
              </Text>
              <AnimatedButtonSimple
                onPress={handleLogout}
                title="Logout"
                variant="secondary"
                style={styles.logoutAnimatedButton}
              />
            </View>
            
            {/* AI Chat Button */}
            <View style={styles.aiChatButtonContainer}>
              <AnimatedButtonSimple
                onPress={() => setShowAIChat(true)}
                title="💬 AI Financial Assistant"
                variant="primary"
                style={styles.aiChatButton}
              />
            </View>
          </AnimatedContainer>
        )}
      
      <AnimatedContainer delay={200} style={styles.inputContainer}>
        <View style={[styles.inputSection, { backgroundColor: theme.currentTheme.colors.surface }]}>
          <Text style={[styles.title, { color: theme.currentTheme.colors.text }]}>Budget Calculator</Text>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.currentTheme.colors.text }]}>Budget Amount</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.currentTheme.colors.background,
              borderColor: theme.currentTheme.colors.primary,
              color: theme.currentTheme.colors.text
            }]}
            value={budgetAmount}
            onChangeText={setBudgetAmount}
            placeholder="Enter amount (e.g., 10000)"
            placeholderTextColor={theme.currentTheme.colors.textSecondary}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.currentTheme.colors.text }]}>Duration</Text>
          <View style={styles.durationButtons}>
            {(['daily', 'weekly', 'monthly'] as const).map((option) => (
              <AnimatedButtonSimple
                key={option}
                onPress={() => setDuration(option)}
                title={option.charAt(0).toUpperCase() + option.slice(1)}
                variant={duration === option ? "primary" : "secondary"}
                style={styles.durationAnimatedButton}
              />
            ))}
          </View>
        </View>

        <AnimatedButton
          title={isGeneratingAI ? '🤖 Generating AI Budget...' : 
                 isLoading ? 'Calculating...' : 
                 'Generate Smart Budget ✨'}
          onPress={handleCalculate}
          disabled={isLoading || isGeneratingAI}
          variant="primary"
          size="large"
          animationType="explosion"
          style={{ marginTop: 10 }}
        />
      </View>
      </AnimatedContainer>

      {/* Loading Animation */}
      <AnimatedLoading
        isLoading={isLoading || isGeneratingAI}
        type="sparkles"
        text={isGeneratingAI ? "AI is crafting your budget..." : "Calculating budget..."}
        overlay={true}
      />

      {/* AI-Powered Comprehensive Breakdown */}
      {aiBreakdown && (
        <View style={[styles.resultsSection, { backgroundColor: theme.currentTheme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.currentTheme.colors.text }]}>🤖 AI-Powered Budget Breakdown</Text>
          <Text style={[styles.aiSubtitle, { color: theme.currentTheme.colors.textSecondary }]}>
            Smart allocation based on your bills + Philippines financial best practices
          </Text>
          
          {/* AI Budget Chart */}
          <BudgetChart breakdown={aiBreakdown} />
          
          {/* Comprehensive Summary */}
          <View style={styles.billsSummary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Your Current Bills:</Text>
              <Text style={styles.summaryValue}>{formatCurrency(monthlyTotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Recommended Total Budget:</Text>
              <Text style={styles.summaryValue}>{formatCurrency(parseFloat(budgetAmount || '0'))}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Available for New Categories:</Text>
              <Text style={[
                styles.summaryValue,
                { color: parseFloat(budgetAmount || '0') > monthlyTotal ? '#4CAF50' : '#F44336' }
              ]}>
                {formatCurrency(Math.max(0, parseFloat(budgetAmount || '0') - monthlyTotal))}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Emergency Fund + Savings:</Text>
              <Text style={[styles.summaryValue, { color: '#FF9800' }]}>
                {formatCurrency(aiBreakdown.total_savings)}
              </Text>
            </View>
          </View>

          {/* AI Recommendations */}
          {aiRecommendations.length > 0 && (
            <View style={styles.recommendationsSection}>
              <Text style={styles.recommendationsTitle}>🧠 AI Recommendations</Text>
              {aiRecommendations.map((recommendation, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <Text style={styles.recommendationText}>{recommendation}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.totalSection}>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>Total Essential Spending</Text>
              <Text style={styles.totalAmount}>
                {formatCurrency(aiBreakdown.total_essential)}
              </Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>Emergency Fund + Savings</Text>
              <Text style={[styles.totalAmount, styles.savingsAmount]}>
                {formatCurrency(aiBreakdown.total_savings)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {actualBreakdown && !aiBreakdown && (
        <View style={styles.resultsSection}>
          <Text style={styles.sectionTitle}>💰 Actual Spending Breakdown</Text>
          
          {/* Budget Chart using actual bills data */}
          <BudgetChart breakdown={actualBreakdown} />
          
          {/* Summary Section */}
          <View style={styles.billsSummary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Bills:</Text>
              <Text style={styles.summaryValue}>{formatCurrency(monthlyTotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Number of Bills:</Text>
              <Text style={styles.summaryValue}>{bills.length}</Text>
            </View>
            {breakdown && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>vs Planned Budget:</Text>
                <Text style={[
                  styles.summaryValue,
                  { color: monthlyTotal <= breakdown.total_essential ? '#4CAF50' : '#F44336' }
                ]}>
                  {monthlyTotal <= breakdown.total_essential ? 'Within Budget' : 'Over Budget'}
                </Text>
              </View>
            )}
          </View>

          {/* Savings Projection */}
          {breakdown && (
            <View style={styles.totalSection}>
              <View style={styles.totalItem}>
                <Text style={styles.totalLabel}>Total Spending</Text>
                <Text style={styles.totalAmount}>
                  {formatCurrency(monthlyTotal)}
                </Text>
              </View>
              <View style={styles.totalItem}>
                <Text style={styles.totalLabel}>Planned Savings</Text>
                <Text style={[styles.totalAmount, styles.savingsAmount]}>
                  {formatCurrency(breakdown.total_savings)}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Show budget breakdown only if no actual bills exist */}
      {breakdown && !actualBreakdown && (
        <View style={styles.resultsSection}>
          <Text style={styles.sectionTitle}>📊 Planned Budget Breakdown</Text>
          
          {/* Budget Chart */}
          <BudgetChart breakdown={breakdown} />
          
          <View style={styles.totalSection}>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>Essential Expenses</Text>
              <Text style={styles.totalAmount}>
                {formatCurrency(breakdown.total_essential)}
              </Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>Total Savings</Text>
              <Text style={[styles.totalAmount, styles.savingsAmount]}>
                {formatCurrency(breakdown.total_savings)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Show helpful message when no bills */}
      {!actualBreakdown && !breakdown && !isLoading && (
        <View style={styles.noDataSection}>
          <Text style={styles.noDataText}>
            💡 Get started by either:
            {'\n'}• Adding bills in the Bills tab to see actual spending
            {'\n'}• Entering a budget amount above to see planned breakdown
          </Text>
        </View>
      )}

      {/* Show message when only planned budget exists */}
      {breakdown && !actualBreakdown && (
        <View style={styles.tipSection}>
          <Text style={styles.tipText}>
            💡 Add bills in the Bills tab to see how your actual spending compares to this planned budget
          </Text>
        </View>
      )}
    </ScrollView>
    
    {/* AI Chatbot Modal */}
    <AIChatbot 
      visible={showAIChat} 
      onClose={() => setShowAIChat(false)} 
    />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerSection: {
    backgroundColor: 'white',
    padding: 16,
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  logoutAnimatedButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  inputSection: {
    backgroundColor: 'white',
    padding: 20,
    margin: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  durationButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  durationButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  durationButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  durationButtonText: {
    fontSize: 14,
    color: '#666',
  },
  durationButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  calculateButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  calculateButtonDisabled: {
    opacity: 0.6,
  },
  calculateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsSection: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  categoriesList: {
    marginTop: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryName: {
    fontSize: 16,
    color: '#333',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
  },
  totalSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#f0f0f0',
  },
  totalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  savingsAmount: {
    color: '#4CAF50',
  },
  noDataSection: {
    backgroundColor: 'white',
    margin: 16,
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  
  // Bills Summary Styles
  billsSummary: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  
  // Tip Section Styles
  tipSection: {
    backgroundColor: '#E3F2FD',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  tipText: {
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
  
  // AI Budget Breakdown Styles
  aiSubtitle: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  recommendationsSection: {
    backgroundColor: '#F3E5F5',
    padding: 16,
    borderRadius: 8,
    marginVertical: 16,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6A1B9A',
    marginBottom: 12,
  },
  recommendationItem: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#9C27B0',
  },
  recommendationText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
  durationAnimatedButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  headerContainer: {
    width: '100%',
  },
  inputContainer: {
    width: '100%',
  },
  resultsContainer: {
    width: '100%',
  },
  aiChatButtonContainer: {
    marginTop: 15,
    paddingHorizontal: 20,
  },
  aiChatButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 25,
    paddingVertical: 12,
  },
});
