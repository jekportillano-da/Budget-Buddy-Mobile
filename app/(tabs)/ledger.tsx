import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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

export default function Ledger() {
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
  } = useSavingsStore();

  // Local component state
  const [showAddModal, setShowAddModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [entryType, setEntryType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize data on component mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        logger.info('Ledger: Initializing savings data...');
        await loadSavingsData();
        logger.info('Ledger: Data initialization complete');
      } catch (error) {
        logger.error('Ledger: Failed to initialize data', error);
      }
    };

    initializeData();

    // Cleanup function
    return () => {
      logger.info('Ledger: Component unmounting, cleaning up...');
    };
  }, [loadSavingsData]);

  return (
    <ScrollView 
      style={styles.scrollContainer}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={loadSavingsData} />
      }
    >
      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Savings</Text>
        <Text style={styles.balanceAmount}>{formatCurrency(currentBalance)}</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Text style={styles.addButtonText}>+ Add Entry</Text>
        </TouchableOpacity>
      </View>

      {/* Placeholder for more features */}
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>🚧 More features coming soon...</Text>
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
              
              <TouchableOpacity 
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
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
                      // Reset form and close modal
                      setAmount('');
                      setEntryType('deposit');
                      setDescription('');
                      setShowAddModal(false);

                      // Show achievement modal if new achievements unlocked
                      if (result.newAchievements.length > 0) {
                        Alert.alert(
                          'Achievement Unlocked!',
                          `Congratulations! You've unlocked ${result.newAchievements.length} new achievement${result.newAchievements.length > 1 ? 's' : ''}!`
                        );
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
              >
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? 'Adding...' : 'Add Entry'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
});