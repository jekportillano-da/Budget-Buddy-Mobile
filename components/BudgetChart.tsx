import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BudgetBreakdown } from '../stores/budgetStore';
import { formatCurrency } from '../utils/currencyUtils';

interface BudgetChartProps {
  breakdown: BudgetBreakdown;
}

const BudgetChart: React.FC<BudgetChartProps> = ({ 
  breakdown
}) => {
  if (!breakdown || !breakdown.categories) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>No budget data available</Text>
      </View>
    );
  }

  const total = breakdown.total_essential + breakdown.total_savings;
  const screenWidth = Dimensions.get('window').width - 40; // padding

  const categoryColors: Record<string, string> = {
    'food/groceries': '#FF6B6B',
    food: '#FF6B6B', // backward compatibility
    transportation: '#4ECDC4',
    utilities: '#45B7D1',
    emergency_fund: '#96CEB4',
    discretionary: '#FFEAA7',
    miscellaneous: '#FFEAA7',
    entertainment: '#9B59B6',
    healthcare: '#E74C3C',
    education: '#F39C12',
    savings: '#27AE60',
  };

  const renderCategory = (category: string, amount: number) => {
    const percentage = (amount / total) * 100;
    const width = (percentage / 100) * screenWidth;

    return (
      <View key={category} style={styles.categoryContainer}>
        <View style={styles.categoryHeader}>
          <View style={styles.categoryInfo}>
            <View 
              style={[
                styles.colorIndicator, 
                { backgroundColor: categoryColors[category] || '#ddd' }
              ]} 
            />
            <Text style={styles.categoryName}>
              {category.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
          <Text style={styles.categoryAmount}>
            {formatCurrency(amount)}
          </Text>
          <Text style={styles.categoryPercentage}>
            {percentage.toFixed(1)}%
          </Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBar,
              { 
                width: Math.max(width, 2), // minimum 2px width for visibility
                backgroundColor: categoryColors[category] || '#ddd'
              }
            ]}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Budget Breakdown</Text>
        <Text style={styles.total}>
          Total: {formatCurrency(total)}
        </Text>
      </View>

      <View style={styles.categoriesContainer}>
        {Object.entries(breakdown.categories).map(([category, amount]) =>
          renderCategory(category, amount)
        )}
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Essential Expenses:</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(breakdown.total_essential)}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Savings:</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(breakdown.total_savings)}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Savings Rate:</Text>
          <Text style={styles.summaryValue}>
            {((breakdown.total_savings / total) * 100).toFixed(1)}%
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  total: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 12,
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#999',
    minWidth: 40,
    textAlign: 'right',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  summaryContainer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  noDataText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    paddingVertical: 20,
  },
});

export default BudgetChart;
