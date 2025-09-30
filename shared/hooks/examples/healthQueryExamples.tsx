/**
 * Health Query Usage Examples
 * Demonstrates how to use the health query hooks in components (for future reference)
 */

import React from 'react';
import { View, Text } from 'react-native';
import { useHealthQuery, useHealthStatus } from '../useHealthQuery';

/**
 * Example component showing basic health query usage
 * NOT currently used in the app - just for reference
 */
export function HealthStatusExample() {
  const { isHealthy, isLoading, lastChecked } = useHealthStatus();

  if (isLoading) {
    return <Text>Checking server status...</Text>;
  }

  if (!isHealthy) {
    return (
      <View>
        <Text>⚠️ Server is currently unavailable</Text>
        {lastChecked && (
          <Text>Last checked: {lastChecked.toLocaleTimeString()}</Text>
        )}
      </View>
    );
  }

  return (
    <View>
      <Text>✅ Server is healthy</Text>
      {lastChecked && (
        <Text>Last checked: {lastChecked.toLocaleTimeString()}</Text>
      )}
    </View>
  );
}

/**
 * Example component showing advanced health query usage
 * NOT currently used in the app - just for reference
 */
export function AdvancedHealthExample() {
  const { 
    data, 
    isLoading, 
    error, 
    refetch, 
    isRefetching 
  } = useHealthQuery({
    enabled: true,
    refetchInterval: 30000, // 30 seconds
  });

  return (
    <View>
      <Text>Server Status: {data?.status || 'Unknown'}</Text>
      
      {data?.version && (
        <Text>Version: {data.version}</Text>
      )}
      
      {data?.timestamp && (
        <Text>Server Time: {new Date(data.timestamp).toLocaleString()}</Text>
      )}
      
      {error && (
        <Text>Error: {error.message}</Text>
      )}
      
      <Text>
        {isLoading ? 'Loading...' : isRefetching ? 'Refreshing...' : 'Ready'}
      </Text>
      
      {/* Example refresh button */}
      {/* <TouchableOpacity onPress={() => refetch()}>
        <Text>Refresh Status</Text>
      </TouchableOpacity> */}
    </View>
  );
}

// Export for potential future use
export const HealthQueryExamples = {
  HealthStatusExample,
  AdvancedHealthExample,
};