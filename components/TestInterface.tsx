/**
 * Development Test Interface - Remove before production
 * Provides easy access to Phase 2 testing functions
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { runPhase2Tests } from '../utils/testRunner';

interface TestInterfaceProps {
  visible?: boolean;
}

export default function TestInterface({ visible = true }: TestInterfaceProps) {
  const [isRunning, setIsRunning] = useState(false);

  const handleRunTests = async () => {
    if (isRunning) return;

    setIsRunning(true);
    
    Alert.alert(
      'Run Phase 2 Tests?',
      'This will test the database, savings, tier system, achievements, and themes.',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setIsRunning(false) },
        { 
          text: 'Run Tests', 
          onPress: async () => {
            try {
              console.log('🧪 Starting comprehensive Phase 2 tests...');
              await runPhase2Tests();
              Alert.alert('Success!', 'All Phase 2 tests passed! Check console for details.');
            } catch (error) {
              console.error('Test error:', error);
              Alert.alert('Test Failed', 'Some tests failed. Check console for details.');
            } finally {
              setIsRunning(false);
            }
          }
        }
      ]
    );
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 Development Testing</Text>
      <TouchableOpacity 
        style={[styles.button, isRunning && styles.buttonDisabled]} 
        onPress={handleRunTests}
        disabled={isRunning}
      >
        <Text style={styles.buttonText}>
          {isRunning ? 'Running Tests...' : 'Run Phase 2 Tests'}
        </Text>
      </TouchableOpacity>
      <Text style={styles.subtitle}>
        Tests database, savings, tiers, achievements & themes
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff3cd',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffeaa7',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  buttonDisabled: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    color: '#856404',
    textAlign: 'center',
  },
});
