/**
 * Budget Buddy Mobile - Savings Entry Form Component
 * @license MIT
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';

interface SavingsEntryFormProps {
  onSubmit: (entry: {
    amount: number;
    entryType: 'deposit' | 'withdrawal';
    label?: string;
    purpose?: string;
  }) => Promise<boolean>;
  isLoading?: boolean;
  onCancel?: () => void;
}

export default function SavingsEntryForm({ 
  onSubmit, 
  isLoading = false, 
  onCancel 
}: SavingsEntryFormProps) {
  const [formData, setFormData] = useState({
    amount: '',
    entryType: 'deposit' as 'deposit' | 'withdrawal',
    label: '',
    purpose: '',
  });

  const handleSubmit = async () => {
    // Validation
    if (!formData.amount.trim()) {
      Alert.alert('Error', 'Please enter an amount');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount greater than 0');
      return;
    }

    // Submit the form
    const success = await onSubmit({
      amount,
      entryType: formData.entryType,
      label: formData.label.trim() || undefined,
      purpose: formData.purpose.trim() || undefined,
    });

    // Reset form on success
    if (success) {
      setFormData({
        amount: '',
        entryType: 'deposit',
        label: '',
        purpose: '',
      });
    }
  };

  const handleCancel = () => {
    // Reset form
    setFormData({
      amount: '',
      entryType: 'deposit',
      label: '',
      purpose: '',
    });
    
    // Call parent cancel handler
    onCancel?.();
  };

  const updateField = (field: keyof typeof formData, value: string | 'deposit' | 'withdrawal') => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Savings Entry</Text>

      {/* Entry Type Selector */}
      <View style={styles.typeSelector}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            formData.entryType === 'deposit' && styles.typeButtonActive
          ]}
          onPress={() => updateField('entryType', 'deposit')}
          disabled={isLoading}
        >
          <Text style={[
            styles.typeButtonText,
            formData.entryType === 'deposit' && styles.typeButtonTextActive
          ]}>💰 Deposit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.typeButton,
            formData.entryType === 'withdrawal' && styles.typeButtonActive
          ]}
          onPress={() => updateField('entryType', 'withdrawal')}
          disabled={isLoading}
        >
          <Text style={[
            styles.typeButtonText,
            formData.entryType === 'withdrawal' && styles.typeButtonTextActive
          ]}>💸 Withdrawal</Text>
        </TouchableOpacity>
      </View>

      {/* Amount Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Amount *</Text>
        <TextInput
          style={[styles.input, isLoading && styles.inputDisabled]}
          value={formData.amount}
          onChangeText={(text) => updateField('amount', text)}
          placeholder="0.00"
          keyboardType="decimal-pad"
          editable={!isLoading}
          autoFocus
        />
      </View>

      {/* Label Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Label (Optional)</Text>
        <TextInput
          style={[styles.input, isLoading && styles.inputDisabled]}
          value={formData.label}
          onChangeText={(text) => updateField('label', text)}
          placeholder="e.g., Monthly savings, Emergency fund"
          maxLength={50}
          editable={!isLoading}
        />
      </View>

      {/* Purpose Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Purpose (Optional)</Text>
        <TextInput
          style={[styles.input, isLoading && styles.inputDisabled]}
          value={formData.purpose}
          onChangeText={(text) => updateField('purpose', text)}
          placeholder="e.g., Vacation, New car, Emergency"
          maxLength={100}
          editable={!isLoading}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        {onCancel && (
          <TouchableOpacity 
            style={[styles.cancelButton, isLoading && styles.buttonDisabled]} 
            onPress={handleCancel}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={[
            styles.submitButton, 
            isLoading && styles.buttonDisabled,
            !onCancel && styles.submitButtonFull
          ]} 
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Text style={styles.submitButtonText}>
            {isLoading ? 'Saving...' : 'Save Entry'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 0,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
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
    borderColor: '#2196F3',
    backgroundColor: '#e3f2fd',
  },
  typeButtonText: {
    fontSize: 16,
    color: '#666',
  },
  typeButtonTextActive: {
    color: '#2196F3',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
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
    color: '#333',
  },
  inputDisabled: {
    backgroundColor: '#f0f0f0',
    color: '#999',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  submitButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#2196F3',
    alignItems: 'center',
  },
  submitButtonFull: {
    flex: 1,
  },
  submitButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
