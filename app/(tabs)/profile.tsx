import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../stores/userStore';
import { useBudgetStore } from '../../stores/budgetStore';
import { useBillsStore } from '../../stores/billsStore';

export default function Profile() {
  const router = useRouter();
  const { profile, totalHouseholdIncome, calculateRecommendedBudget, getRegionalData } = useUserStore();
  const { currentBudget } = useBudgetStore();
  const { monthlyTotal } = useBillsStore();

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  };

  const recommendedBudget = calculateRecommendedBudget();
  const regionalData = getRegionalData();

  const renderProfileSummary = () => (
    <View style={styles.summaryCard}>
      <View style={styles.avatarContainer}>
        <Text style={styles.avatar}>👤</Text>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {profile?.fullName || 'Complete your profile'}
          </Text>
          <Text style={styles.userLocation}>
            {profile?.location === 'ncr' ? 'NCR' : 'Province'} • {profile?.employmentStatus || 'No status'}
          </Text>
        </View>
      </View>
      
      {!profile?.fullName && (
        <TouchableOpacity
          style={styles.setupButton}
          onPress={() => router.push('/(tabs)/settings')}
        >
          <Text style={styles.setupButtonText}>Set up profile</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderFinancialOverview = () => (
    <View style={styles.overviewCard}>
      <Text style={styles.cardTitle}>Financial Overview</Text>
      
      <View style={styles.overviewGrid}>
        <View style={styles.overviewItem}>
          <Text style={styles.overviewLabel}>Monthly Income</Text>
          <Text style={styles.overviewValue}>
            {formatCurrency(totalHouseholdIncome || profile?.monthlyNetIncome || 0)}
          </Text>
          {profile?.hasSpouse && (
            <Text style={styles.overviewSubtext}>
              Including spouse: {formatCurrency(profile.spouseIncome || 0)}
            </Text>
          )}
        </View>
        
        <View style={styles.overviewItem}>
          <Text style={styles.overviewLabel}>Current Budget</Text>
          <Text style={styles.overviewValue}>
            {formatCurrency(currentBudget || 0)}
          </Text>
        </View>
        
        <View style={styles.overviewItem}>
          <Text style={styles.overviewLabel}>Monthly Bills</Text>
          <Text style={styles.overviewValue}>
            {formatCurrency(monthlyTotal)}
          </Text>
        </View>
        
        <View style={styles.overviewItem}>
          <Text style={styles.overviewLabel}>Dependents</Text>
          <Text style={styles.overviewValue}>
            {profile?.numberOfDependents || 0}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.actionsCard}>
      <Text style={styles.cardTitle}>Quick Actions</Text>
      
      <View style={styles.actionsList}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push('/(tabs)/settings')}
        >
          <Text style={styles.actionEmoji}>⚙️</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Edit Profile</Text>
            <Text style={styles.actionDescription}>Update personal and financial information</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push('/(tabs)/dashboard')}
        >
          <Text style={styles.actionEmoji}>💰</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Create Budget</Text>
            <Text style={styles.actionDescription}>Set up a new budget plan</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push('/(tabs)/bills')}
        >
          <Text style={styles.actionEmoji}>🧾</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Manage Bills</Text>
            <Text style={styles.actionDescription}>Add and track your monthly bills</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {renderProfileSummary()}
        {renderFinancialOverview()}
        {renderQuickActions()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    fontSize: 48,
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userLocation: {
    fontSize: 14,
    color: '#666',
  },
  setupButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  setupButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },

  // Cards
  overviewCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionsCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    marginBottom: 32,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },

  // Overview Grid
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  overviewItem: {
    flex: 1,
    minWidth: '45%',
  },
  overviewLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  overviewValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  overviewSubtext: {
    fontSize: 12,
    color: '#999',
  },

  // Quick Actions
  actionsList: {
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  actionEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
});
