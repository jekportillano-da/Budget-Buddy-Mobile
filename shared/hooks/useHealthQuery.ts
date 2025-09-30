/**
 * Health Query Hook
 * React Query hook for health endpoint - read-only, no UI changes
 */

import { useQuery } from '@tanstack/react-query';
import { authClient } from '../api/clients/authClient';
import type { HealthResponse } from '../api/schemas/auth';

interface HealthQueryOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

/**
 * Health check query hook
 * Provides server health status with caching and background refetching
 */
export function useHealthQuery(options: HealthQueryOptions = {}) {
  const {
    enabled = true,
    refetchInterval = 5 * 60 * 1000, // 5 minutes
  } = options;

  return useQuery<HealthResponse, Error>({
    queryKey: ['health'],
    queryFn: async () => {
      return await authClient.health();
    },
    enabled,
    refetchInterval,
    refetchIntervalInBackground: true,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: (failureCount, error) => {
      // Retry up to 3 times, but not for 404s or client errors
      if (error && 'status' in error && typeof error.status === 'number') {
        if (error.status >= 400 && error.status < 500) {
          return false; // Don't retry client errors
        }
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
}

/**
 * Simple health status checker
 * Returns a boolean indicating if the server is healthy
 */
export function useHealthStatus(): {
  isHealthy: boolean;
  isLoading: boolean;
  lastChecked: Date | null;
} {
  const { data, isLoading, dataUpdatedAt } = useHealthQuery();
  
  return {
    isHealthy: data?.status === 'ok' || data?.status === 'healthy',
    isLoading,
    lastChecked: dataUpdatedAt ? new Date(dataUpdatedAt) : null,
  };
}