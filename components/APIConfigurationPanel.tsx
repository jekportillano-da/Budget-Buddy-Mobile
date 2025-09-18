/**
 * API Configuration Component for Budget Buddy Mobile
 * Allows users to manage hybrid API settings and view status
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, Alert, TouchableOpacity } from 'react-native';
import { apiConfigService, hybridAPIClient } from '../services';
import type { APIMode, APIConfig, BackendHealthStatus } from '../services';

export const APIConfigurationPanel: React.FC = () => {
  const [config, setConfig] = useState<APIConfig>(apiConfigService.getConfig());
  const [health, setHealth] = useState<BackendHealthStatus>(apiConfigService.getHealthStatus());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Update state when configuration changes
    const interval = setInterval(() => {
      setConfig(apiConfigService.getConfig());
      setHealth(apiConfigService.getHealthStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleModeChange = (mode: APIMode) => {
    apiConfigService.updateConfig({ mode });
    setConfig(apiConfigService.getConfig());
  };

  const handleToggleChange = (key: keyof APIConfig, value: boolean) => {
    apiConfigService.updateConfig({ [key]: value });
    setConfig(apiConfigService.getConfig());
  };

  const handleHealthCheck = async () => {
    setIsLoading(true);
    try {
      await apiConfigService.performHealthCheck();
      setHealth(apiConfigService.getHealthStatus());
      Alert.alert(
        'Health Check Complete',
        health.isHealthy ? 'Backend is healthy!' : 'Backend is not responding'
      );
    } catch (error) {
      Alert.alert('Health Check Failed', 'Could not connect to backend');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestAPI = async () => {
    setIsLoading(true);
    try {
      const response = await hybridAPIClient.healthCheck();
      Alert.alert(
        'API Test',
        response.success 
          ? `Success! Source: ${response.source}` 
          : `Failed: ${response.error}`
      );
    } catch (error) {
      Alert.alert('API Test Failed', 'Could not test API connection');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = () => {
    switch (config.mode) {
      case 'backend':
        return health.isHealthy ? '#4CAF50' : '#F44336';
      case 'direct':
        return '#2196F3';
      case 'auto':
        return health.isHealthy ? '#4CAF50' : '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusText = () => {
    switch (config.mode) {
      case 'backend':
        return health.isHealthy ? 'Backend Connected' : 'Backend Unavailable';
      case 'direct':
        return 'Direct API Only';
      case 'auto':
        return health.isHealthy ? 'Auto (Using Backend)' : 'Auto (Using Direct)';
      default:
        return 'Unknown';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>API Configuration</Text>
      
      {/* Status Indicator */}
      <View style={styles.statusContainer}>
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
        <Text style={styles.statusText}>{getStatusText()}</Text>
      </View>

      {/* API Mode Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API Mode</Text>
        
        <TouchableOpacity 
          style={[styles.modeButton, config.mode === 'auto' && styles.modeButtonActive]}
          onPress={() => handleModeChange('auto')}
        >
          <Text style={[styles.modeText, config.mode === 'auto' && styles.modeTextActive]}>
            Auto (Recommended)
          </Text>
          <Text style={styles.modeDescription}>
            Automatically use backend when available, fallback to direct API
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.modeButton, config.mode === 'backend' && styles.modeButtonActive]}
          onPress={() => handleModeChange('backend')}
        >
          <Text style={[styles.modeText, config.mode === 'backend' && styles.modeTextActive]}>
            Backend Only
          </Text>
          <Text style={styles.modeDescription}>
            Use backend API only (requires backend to be running)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.modeButton, config.mode === 'direct' && styles.modeButtonActive]}
          onPress={() => handleModeChange('direct')}
        >
          <Text style={[styles.modeText, config.mode === 'direct' && styles.modeTextActive]}>
            Direct API Only
          </Text>
          <Text style={styles.modeDescription}>
            Use direct API calls only (legacy mode)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Backend Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Backend Settings</Text>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Backend URL</Text>
          <Text style={styles.settingValue}>{config.backendUrl}</Text>
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Enable Fallback</Text>
          <Switch
            value={config.enableFallback}
            onValueChange={(value) => handleToggleChange('enableFallback', value)}
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Use Backend for AI</Text>
          <Switch
            value={config.useBackendForAI}
            onValueChange={(value) => handleToggleChange('useBackendForAI', value)}
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Use Backend for Auth</Text>
          <Switch
            value={config.useBackendForAuth}
            onValueChange={(value) => handleToggleChange('useBackendForAuth', value)}
          />
        </View>
      </View>

      {/* Backend Health */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Backend Health</Text>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Status</Text>
          <Text style={[styles.healthStatus, { color: health.isHealthy ? '#4CAF50' : '#F44336' }]}>
            {health.isHealthy ? 'Healthy' : 'Unhealthy'}
          </Text>
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Last Check</Text>
          <Text style={styles.settingValue}>
            {health.lastChecked.toLocaleTimeString()}
          </Text>
        </View>

        {health.responseTime && (
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Response Time</Text>
            <Text style={styles.settingValue}>{health.responseTime}ms</Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]}
          onPress={handleHealthCheck}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Checking...' : 'Health Check'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]}
          onPress={handleTestAPI}
          disabled={isLoading}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            {isLoading ? 'Testing...' : 'Test API'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  modeButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 8,
  },
  modeButtonActive: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  modeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  modeTextActive: {
    color: '#2196F3',
  },
  modeDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  settingValue: {
    fontSize: 14,
    color: '#666',
  },
  healthStatus: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#2196F3',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButtonText: {
    color: '#2196F3',
  },
});