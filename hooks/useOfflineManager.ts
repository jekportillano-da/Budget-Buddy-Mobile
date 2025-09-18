/**
 * Budget Buddy Mobile - Enhanced Offline Manager
 * @license MIT
 */
import { useState, useEffect, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

interface OfflineState {
  isOnline: boolean;
  isConnected: boolean;
  connectionType: string | null;
  pendingOperations: PendingOperation[];
}

const PENDING_OPERATIONS_KEY = '@budget_buddy_pending_operations';
const MAX_RETRY_COUNT = 3;

export const useOfflineManager = () => {
  const [offlineState, setOfflineState] = useState<OfflineState>({
    isOnline: true,
    isConnected: true,
    connectionType: null,
    pendingOperations: [],
  });

  // Initialize offline state and load pending operations
  useEffect(() => {
    const initializeOfflineState = async () => {
      try {
        // Load pending operations from storage
        const storedOperations = await AsyncStorage.getItem(PENDING_OPERATIONS_KEY);
        if (storedOperations) {
          const operations = JSON.parse(storedOperations);
          setOfflineState(prev => ({
            ...prev,
            pendingOperations: operations,
          }));
        }

        // Get initial network state
        const netInfoState = await NetInfo.fetch();
        setOfflineState(prev => ({
          ...prev,
          isOnline: netInfoState.isConnected || false,
          isConnected: netInfoState.isConnected || false,
          connectionType: netInfoState.type,
        }));
      } catch (error) {
        logger.error('Failed to initialize offline state:', error);
      }
    };

    initializeOfflineState();
  }, []);

  // Listen for network state changes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const wasOnline = offlineState.isOnline;
      const isNowOnline = state.isConnected || false;

      setOfflineState(prev => ({
        ...prev,
        isOnline: isNowOnline,
        isConnected: isNowOnline,
        connectionType: state.type,
      }));

      // If we just came back online, process pending operations
      if (!wasOnline && isNowOnline) {
        processPendingOperations();
      }

      logger.info('Network state changed:', {
        isConnected: state.isConnected,
        type: state.type,
        wasOnline,
        isNowOnline
      });
    });

    return unsubscribe;
  }, [offlineState.isOnline]);

  // Queue an operation for later execution when online
  const queueOperation = useCallback(async (
    type: 'create' | 'update' | 'delete',
    table: string,
    data: any
  ) => {
    const operation: PendingOperation = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      table,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    const newOperations = [...offlineState.pendingOperations, operation];
    
    setOfflineState(prev => ({
      ...prev,
      pendingOperations: newOperations,
    }));

    // Persist to storage
    try {
      await AsyncStorage.setItem(PENDING_OPERATIONS_KEY, JSON.stringify(newOperations));
      logger.info('Queued offline operation:', { operation });
    } catch (error) {
      logger.error('Failed to queue operation:', error);
    }

    return operation.id;
  }, [offlineState.pendingOperations]);

  // Process all pending operations
  const processPendingOperations = useCallback(async () => {
    if (!offlineState.isOnline || offlineState.pendingOperations.length === 0) {
      return;
    }

    logger.info('Processing pending operations:', {
      count: offlineState.pendingOperations.length
    });

    const successfulOperations: string[] = [];
    const failedOperations: PendingOperation[] = [];

    for (const operation of offlineState.pendingOperations) {
      try {
        // Here you would execute the actual operation
        // For now, we'll simulate the operation
        await executeOperation(operation);
        successfulOperations.push(operation.id);
        logger.info('Successfully processed operation:', operation.id);
      } catch (error) {
        logger.error('Failed to process operation:', { operation, error });
        
        // Increment retry count
        const updatedOperation = {
          ...operation,
          retryCount: operation.retryCount + 1,
        };

        // Only keep if under retry limit
        if (updatedOperation.retryCount < MAX_RETRY_COUNT) {
          failedOperations.push(updatedOperation);
        } else {
          logger.error('Operation exceeded retry limit, discarding:', operation);
        }
      }
    }

    // Update pending operations (remove successful, keep failed for retry)
    const remainingOperations = failedOperations;
    
    setOfflineState(prev => ({
      ...prev,
      pendingOperations: remainingOperations,
    }));

    // Update storage
    try {
      await AsyncStorage.setItem(PENDING_OPERATIONS_KEY, JSON.stringify(remainingOperations));
    } catch (error) {
      logger.error('Failed to update pending operations:', error);
    }
  }, [offlineState.isOnline, offlineState.pendingOperations]);

  // Execute a single operation (implement your actual sync logic here)
  const executeOperation = async (operation: PendingOperation): Promise<void> => {
    // This is where you would implement the actual API calls
    // For example, uploading to Supabase or your backend
    
    switch (operation.type) {
      case 'create':
        // await supabaseService.create(operation.table, operation.data);
        break;
      case 'update':
        // await supabaseService.update(operation.table, operation.data);
        break;
      case 'delete':
        // await supabaseService.delete(operation.table, operation.data.id);
        break;
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
  };

  // Clear all pending operations (useful for testing or manual reset)
  const clearPendingOperations = useCallback(async () => {
    setOfflineState(prev => ({
      ...prev,
      pendingOperations: [],
    }));
    
    try {
      await AsyncStorage.removeItem(PENDING_OPERATIONS_KEY);
    } catch (error) {
      logger.error('Failed to clear pending operations:', error);
    }
  }, []);

  // Get offline status info
  const getOfflineInfo = useCallback(() => ({
    isOnline: offlineState.isOnline,
    isConnected: offlineState.isConnected,
    connectionType: offlineState.connectionType,
    pendingCount: offlineState.pendingOperations.length,
    hasPendingOperations: offlineState.pendingOperations.length > 0,
  }), [offlineState]);

  return {
    ...offlineState,
    queueOperation,
    processPendingOperations,
    clearPendingOperations,
    getOfflineInfo,
  };
};

export default useOfflineManager;