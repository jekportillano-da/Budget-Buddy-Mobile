/**
 * Budget Buddy Mobile - Loading Wrapper Component
 * @license MIT
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import AnimatedLoading from './AnimatedLoading';

interface LoadingWrapperProps {
  isLoading: boolean;
  error?: string | null;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loadingText?: string;
  onRetry?: () => void;
  emptyState?: {
    message: string;
    action?: {
      label: string;
      onPress: () => void;
    };
  };
  isEmpty?: boolean;
}

const LoadingWrapper: React.FC<LoadingWrapperProps> = ({
  isLoading,
  error,
  children,
  fallback,
  loadingText,
  onRetry,
  emptyState,
  isEmpty = false,
}) => {
  // Show error state
  if (error) {
    return (
      <View style={styles.stateContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        {onRetry && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Show loading state
  if (isLoading) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <View style={styles.loadingContainer}>
        <AnimatedLoading 
          isLoading={true} 
          type="spinner" 
          size="medium"
          text={loadingText || "Loading..."}
        />
      </View>
    );
  }

  // Show empty state
  if (isEmpty && emptyState) {
    return (
      <View style={styles.stateContainer}>
        <Text style={styles.emptyIcon}>📭</Text>
        <Text style={styles.emptyTitle}>No data yet</Text>
        <Text style={styles.emptyMessage}>{emptyState.message}</Text>
        {emptyState.action && (
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={emptyState.action.onPress}
          >
            <Text style={styles.actionText}>{emptyState.action.label}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Show content
  return <>{children}</>;
};

const styles = StyleSheet.create({
  stateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  actionButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoadingWrapper;