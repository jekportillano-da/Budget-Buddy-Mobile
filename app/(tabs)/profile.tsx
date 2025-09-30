import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../stores/userStore';
import { useBudgetStore } from '../../stores/budgetStore';
import { useBillsStore } from '../../stores/billsStore';
import { useSavingsStore } from '../../stores/savingsStore';
import { getTierEmoji } from '../../shared/entities/tier/tierAccess';

export default function Profile() {
  const router = useRouter();
  const { profile, totalHouseholdIncome, calculateRecommendedBudget, getRegionalData } = useUserStore();
  const { currentBudget } = useBudgetStore();
  const { monthlyTotal } = useBillsStore();
  const { currentTier, achievements, stats, currentBalance } = useSavingsStore();
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);

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

  const renderGamificationSection = () => (
    <View style={styles.gamificationCard}>
      <Text style={styles.cardTitle}>🏆 Savings Progress</Text>
      
      {/* Current Tier Display */}
      <View style={styles.tierContainer}>
        <View style={styles.tierBadge}>
          <Text style={styles.tierEmoji}>{getTierEmoji(currentTier.name)}</Text>
          <View style={styles.tierInfo}>
            <Text style={styles.tierName}>{currentTier.name}</Text>
            <Text style={styles.tierBalance}>₱{currentBalance.toLocaleString()}</Text>
          </View>
          <View style={styles.tierProgress}>
            <Text style={styles.progressText}>{Math.round(currentTier.progress)}%</Text>
          </View>
        </View>
        
        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${currentTier.progress}%` }]} />
        </View>
        
        {currentTier.nextTier && (
          <Text style={styles.nextTierText}>
            Next: {currentTier.nextTier.name} at ₱{currentTier.nextTier.threshold.toLocaleString()}
          </Text>
        )}
      </View>

      {/* Recent Achievements */}
      <View style={styles.achievementsContainer}>
        <Text style={styles.achievementsTitle}>Recent Achievements</Text>
        {achievements.length === 0 ? (
          <Text style={styles.noAchievements}>Start saving to unlock achievements!</Text>
        ) : (
          <View style={styles.achievementsList}>
            {achievements.slice(0, 3).map((achievement, index) => (
              <View key={achievement.id || index} style={styles.achievementItem}>
                <Text style={styles.achievementEmoji}>
                  {achievement.achievement_type === 'tier' ? '🎖️' : '🏅'}
                </Text>
                <View style={styles.achievementInfo}>
                  <Text style={styles.achievementName}>{achievement.achievement_name}</Text>
                  <Text style={styles.achievementDate}>
                    {new Date(achievement.achieved_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))}
            {achievements.length > 3 && (
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => setShowAchievementsModal(true)}
              >
                <Text style={styles.viewAllText}>View all {achievements.length} achievements</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Quick Stats */}
      {stats && (
        <View style={styles.quickStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalEntries}</Text>
            <Text style={styles.statLabel}>Transactions</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>₱{Math.round(stats.averageEntry).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Avg Entry</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>₱{Math.round(stats.monthlyAverage).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Monthly Avg</Text>
          </View>
        </View>
      )}
    </View>
  );

  // getTierEmoji function moved to centralized tier access logic

  const renderAchievementsModal = () => (
    <Modal
      visible={showAchievementsModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>🏆 All Achievements</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowAchievementsModal(false)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          {achievements.length === 0 ? (
            <View style={styles.emptyModalState}>
              <Text style={styles.emptyModalText}>No achievements yet!</Text>
              <Text style={styles.emptyModalSubtext}>Start saving to unlock your first achievement.</Text>
            </View>
          ) : (
            <View style={styles.allAchievementsList}>
              {achievements.map((achievement, index) => (
                <View key={achievement.id || index} style={styles.fullAchievementItem}>
                  <View style={styles.achievementLeft}>
                    <Text style={styles.fullAchievementEmoji}>
                      {achievement.achievement_type === 'tier' ? '🎖️' : '🏅'}
                    </Text>
                    <View style={styles.fullAchievementInfo}>
                      <Text style={styles.fullAchievementName}>{achievement.achievement_name}</Text>
                      <Text style={styles.achievementType}>
                        {achievement.achievement_type === 'tier' ? 'Tier Achievement' : 'Milestone Achievement'}
                      </Text>
                      <Text style={styles.achievementAmount}>
                        Achieved at ₱{achievement.total_savings_at_achievement?.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.achievementRight}>
                    <Text style={styles.fullAchievementDate}>
                      {new Date(achievement.achieved_at).toLocaleDateString()}
                    </Text>
                    <Text style={styles.achievementTime}>
                      {new Date(achievement.achieved_at).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
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
        {renderGamificationSection()}
        {renderQuickActions()}
      </ScrollView>
      {renderAchievementsModal()}
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

  // Gamification Section
  gamificationCard: {
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
  tierContainer: {
    marginBottom: 20,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  tierEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  tierInfo: {
    flex: 1,
  },
  tierName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  tierBalance: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
  },
  tierProgress: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4caf50',
    borderRadius: 4,
  },
  nextTierText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  achievementsContainer: {
    marginBottom: 20,
  },
  achievementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  noAchievements: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 16,
  },
  achievementsList: {
    // Container for achievements list
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  achievementEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  achievementDate: {
    fontSize: 12,
    color: '#666',
  },
  viewAllButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },

  // Achievement Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  emptyModalState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyModalText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptyModalSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  allAchievementsList: {
    gap: 12,
  },
  fullAchievementItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  achievementLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fullAchievementEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  fullAchievementInfo: {
    flex: 1,
  },
  fullAchievementName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  achievementType: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '500',
    marginBottom: 2,
  },
  achievementAmount: {
    fontSize: 12,
    color: '#666',
  },
  achievementRight: {
    alignItems: 'flex-end',
  },
  fullAchievementDate: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    marginBottom: 2,
  },
  achievementTime: {
    fontSize: 10,
    color: '#999',
  },
});
