import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { useSavingsStore } from '../../stores/savingsStore';
import { formatCurrency } from '../../utils/currencyUtils';
import { logger } from '../../utils/logger';
import type { SavingsEntry, UserAchievement } from '../../services/databaseService';
import { useTheme } from '../../contexts/ThemeContext';
import AnimatedButton from '../../components/AnimatedButton';
import SavingsCelebration from '../../components/SavingsCelebration';
import AnimatedLoading from '../../components/AnimatedLoading';

export default function Ledger() {
  const theme = useTheme();
  
  const {
    currentBalance,
    savingsHistory,
    currentTier,
    achievements,
    isLoading,
    error,
    addSavingsEntry,
    loadSavingsData,
    refreshBalance,
    clearError,
    syncTierWithAuth,
  } = useSavingsStore();

  // Local component state
  const [showAddModal, setShowAddModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [entryType, setEntryType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [newAchievements, setNewAchievements] = useState<UserAchievement[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationAmount, setCelebrationAmount] = useState(0);

  // Initialize data on component mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        logger.info('Ledger: Initializing savings data...');
        await loadSavingsData();
        
        // Sync tier with auth store to ensure consistency
        logger.info('Ledger: Syncing tier with auth...');
        await syncTierWithAuth();
        
        logger.info('Ledger: Data initialization and tier sync complete');
      } catch (error) {
        logger.error('Ledger: Failed to initialize data', error);
      }
    };

    initializeData();

    // Cleanup function
    return () => {
      logger.info('Ledger: Component unmounting, cleaning up...');
    };
  }, [loadSavingsData, syncTierWithAuth]);

  return (
    <ScrollView 
      style={[styles.scrollContainer, { backgroundColor: theme.currentTheme.colors.background }]}
      contentContainerStyle={{ paddingBottom: 96 }}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={loadSavingsData} />
      }
    >
      {/* Balance Card */}
      <View style={[styles.balanceCard, { backgroundColor: theme.currentTheme.colors.surface }]}>
        <View style={styles.balanceHeader}>
          <Text style={[styles.balanceLabel, { color: theme.currentTheme.colors.textSecondary }]}>Total Savings</Text>
          {currentTier && (
            <View style={[styles.tierBadge, { backgroundColor: theme.currentTheme.colors.accent }]}>
              <Text style={[styles.tierBadgeText, { color: theme.currentTheme.colors.surface }]}>🏆 {currentTier.name}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.balanceAmount, { color: theme.currentTheme.colors.primary }]}>{formatCurrency(currentBalance)}</Text>
        <AnimatedButton
          title="+ Add Entry"
          onPress={() => setShowAddModal(true)}
          variant="primary"
          size="medium"
          animationType="bounce"
          style={styles.addButton}
        />
      </View>

      {/* Savings History */}
      <View style={styles.historyCard}>
        <Text style={styles.historyTitle}>Recent Transactions</Text>
        {savingsHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No transactions yet</Text>
            <Text style={styles.emptyStateSubtext}>Add your first savings entry to get started!</Text>
          </View>
        ) : (
          <View style={styles.transactionsList}>
            {savingsHistory.map((entry) => (
              <View key={entry.id} style={styles.transactionItem}>
                <View style={styles.transactionLeft}>
                  <Text style={styles.transactionType}>
                    {entry.entry_type === 'deposit' ? '💰' : '💸'} {entry.entry_type.charAt(0).toUpperCase() + entry.entry_type.slice(1)}
                  </Text>
                  {entry.purpose && (
                    <Text style={styles.transactionDescription}>{entry.purpose}</Text>
                  )}
                  <Text style={styles.transactionDate}>
                    {new Date(entry.date_entered).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.transactionRight}>
                  <Text style={[
                    styles.transactionAmount,
                    entry.entry_type === 'deposit' ? styles.depositAmount : styles.withdrawalAmount
                  ]}>
                    {entry.entry_type === 'deposit' ? '+' : '-'}{formatCurrency(Math.abs(entry.amount))}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Add Entry Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Savings Entry</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount *</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                keyboardType="numeric"
                editable={!isSubmitting}
              />
            </View>

            {/* Entry Type Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Type *</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    entryType === 'deposit' && styles.typeButtonActive
                  ]}
                  onPress={() => setEntryType('deposit')}
                  disabled={isSubmitting}
                >
                  <Text style={[
                    styles.typeButtonText,
                    entryType === 'deposit' && styles.typeButtonTextActive
                  ]}>💰 Deposit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    entryType === 'withdrawal' && styles.typeButtonActive
                  ]}
                  onPress={() => setEntryType('withdrawal')}
                  disabled={isSubmitting}
                >
                  <Text style={[
                    styles.typeButtonText,
                    entryType === 'withdrawal' && styles.typeButtonTextActive
                  ]}>💸 Withdrawal</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={styles.input}
                value={description}
                onChangeText={setDescription}
                placeholder="What are you saving for?"
                multiline
                numberOfLines={2}
                editable={!isSubmitting}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowAddModal(false)}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <AnimatedButton
                title={isSubmitting ? 'Adding...' : 'Add Entry ✨'}
                onPress={async () => {
                  if (!amount) {
                    Alert.alert('Error', 'Please enter an amount');
                    return;
                  }

                  const amountNumber = parseFloat(amount);
                  if (isNaN(amountNumber) || amountNumber <= 0) {
                    Alert.alert('Error', 'Please enter a valid amount greater than 0');
                    return;
                  }

                  setIsSubmitting(true);
                  try {
                    const result = await addSavingsEntry(
                      amountNumber,
                      entryType,
                      undefined, // label - optional 
                      description || undefined // purpose - optional
                    );

                    if (result.success) {
                      // Show celebration for deposits
                      if (entryType === 'deposit') {
                        setCelebrationAmount(amountNumber);
                        setShowCelebration(true);
                      }

                      // Reset form and close modal
                      setAmount('');
                      setEntryType('deposit');
                      setDescription('');
                      setShowAddModal(false);

                      // Show achievement modal if new achievements unlocked
                      if (result.newAchievements.length > 0) {
                        setNewAchievements(result.newAchievements);
                        setShowAchievementModal(true);
                      }

                      logger.info('✅ Savings entry saved successfully');
                    } else {
                      Alert.alert('Error', 'Failed to save savings entry');
                    }
                  } catch (error) {
                    logger.error('❌ Error saving savings entry:', error);
                    Alert.alert('Error', 'An unexpected error occurred');
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                disabled={isSubmitting}
                variant={entryType === 'deposit' ? 'success' : 'warning'}
                size="large"
                animationType="explosion"
                style={styles.submitButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Achievement Notification Modal */}
      <Modal
        visible={showAchievementModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowAchievementModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.achievementModalContent}>
            <Text style={styles.achievementModalTitle}>🎉 Achievement Unlocked!</Text>
            <Text style={styles.achievementModalSubtitle}>
              Congratulations! You've unlocked {newAchievements.length} new achievement{newAchievements.length > 1 ? 's' : ''}!
            </Text>
            
            <View style={styles.achievementsGridContainer}>
              <FlatList
                data={newAchievements}
                keyExtractor={(item) => String(item.id)}
                numColumns={3}
                contentContainerStyle={styles.achievementsGridContent}
                columnWrapperStyle={styles.achievementsGridRow}
                renderItem={({ item }) => (
                  <View style={styles.achievementGridItem}>
                    <Text style={styles.achievementGridEmoji}>
                      {item.achievement_type === 'tier' ? '🏆' : '⭐'}
                    </Text>
                    <Text numberOfLines={2} style={styles.achievementGridName}>
                      {item.achievement_name}
                    </Text>
                    <Text style={styles.achievementGridType}>
                      {item.achievement_type === 'tier' ? 'Tier' : 'Milestone'}
                    </Text>
                  </View>
                )}
                showsVerticalScrollIndicator={false}
              />
            </View>
            
            <TouchableOpacity
              style={styles.achievementModalButton}
              onPress={() => setShowAchievementModal(false)}
            >
              <Text style={styles.achievementModalButtonText}>Awesome!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Savings Celebration */}
      <SavingsCelebration
        amount={celebrationAmount}
        isVisible={showCelebration}
        onComplete={() => setShowCelebration(false)}
      />

      {/* Loading Animation */}
      <AnimatedLoading
        isLoading={isSubmitting}
        type="coins"
        text="Adding to your savings..."
        overlay={true}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  balanceCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 16,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  tierBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2196f3',
  },
  tierBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976d2',
  },
  addButton: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  placeholder: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  balance: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2e7d32',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    margin: 20,
    padding: 24,
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  submitButton: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#4caf50',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  submitButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  typeButtonActive: {
    borderColor: '#4caf50',
    backgroundColor: '#e8f5e8',
  },
  typeButtonText: {
    fontSize: 16,
    color: '#666',
  },
  typeButtonTextActive: {
    color: '#4caf50',
    fontWeight: '600',
  },
  historyCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
  },
  transactionsList: {
    // No specific styles needed - just a container
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionLeft: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  transactionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  depositAmount: {
    color: '#4caf50',
  },
  withdrawalAmount: {
    color: '#f44336',
  },
  // Achievement Modal Styles
  achievementModalContent: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    maxHeight: '80%',
  },
  achievementModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  achievementModalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  achievementsGridContainer: {
    width: '100%',
    maxHeight: 320,
    marginBottom: 20,
  },
  achievementsGridContent: {
    paddingHorizontal: 4,
  },
  achievementsGridRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  achievementGridItem: {
    width: '32%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  achievementGridEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  achievementGridName: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    marginBottom: 2,
  },
  achievementGridType: {
    fontSize: 10,
    color: '#666',
  },
  achievementsList: {
    width: '100%',
    marginBottom: 20,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  achievementEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  achievementType: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  achievementModalButton: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    minWidth: 120,
  },
  achievementModalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});