/**
 * API Configuration Service for Budget Buddy Mobile
 * Manages hybrid API configuration supporting both direct API calls and backend proxy
 */

import { logger } from '../utils/logger';

export type APIMode = 'direct' | 'backend' | 'auto';

export interface APIConfig {
  mode: APIMode;
  backendUrl: string;
  backendTimeout: number;
  enableFallback: boolean;
  useBackendForAuth: boolean;
  useBackendForAI: boolean;
  healthCheckInterval: number;
}

export interface BackendHealthStatus {
  isHealthy: boolean;
  lastChecked: Date;
  responseTime?: number;
  version?: string;
  features?: string[];
}

class APIConfigurationService {
  private config: APIConfig;
  private healthStatus: BackendHealthStatus;
  private healthCheckTimer?: NodeJS.Timeout;

  constructor() {
    this.config = this.loadConfiguration();
    this.healthStatus = {
      isHealthy: false,
      lastChecked: new Date(),
    };
    
    if (this.config.mode === 'auto' || this.config.mode === 'backend') {
      this.startHealthMonitoring();
    }
  }

  /**
   * Load configuration from environment variables with intelligent defaults
   */
  private loadConfiguration(): APIConfig {
    const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    const mode = (process.env.EXPO_PUBLIC_API_MODE as APIMode) || 'auto';
    
    return {
      mode,
      backendUrl,
      backendTimeout: parseInt(process.env.EXPO_PUBLIC_BACKEND_TIMEOUT || '5000'),
      enableFallback: process.env.EXPO_PUBLIC_ENABLE_FALLBACK !== 'false',
      useBackendForAuth: process.env.EXPO_PUBLIC_USE_BACKEND_AUTH === 'true',
      useBackendForAI: process.env.EXPO_PUBLIC_USE_BACKEND_AI === 'true',
      healthCheckInterval: parseInt(process.env.EXPO_PUBLIC_HEALTH_CHECK_INTERVAL || '30000'),
    };
  }

  /**
   * Get current API configuration
   */
  getConfig(): APIConfig {
    return { ...this.config };
  }

  /**
   * Get backend health status
   */
  getHealthStatus(): BackendHealthStatus {
    return { ...this.healthStatus };
  }

  /**
   * Check if backend should be used for a specific service
   */
  shouldUseBackend(service: 'auth' | 'ai' | 'general'): boolean {
    switch (this.config.mode) {
      case 'direct':
        return false;
      case 'backend':
        return this.healthStatus.isHealthy;
      case 'auto':
        if (!this.healthStatus.isHealthy) return false;
        
        switch (service) {
          case 'auth':
            return this.config.useBackendForAuth;
          case 'ai':
            return this.config.useBackendForAI;
          default:
            return true;
        }
      default:
        return false;
    }
  }

  /**
   * Get the appropriate API endpoint for a service
   */
  getEndpoint(service: 'auth' | 'ai' | 'health', path: string): string {
    const serviceType = service === 'health' ? 'general' : service;
    if (this.shouldUseBackend(serviceType)) {
      return `${this.config.backendUrl}/${service}${path}`;
    }
    
    // Return direct API endpoints based on service
    switch (service) {
      case 'ai':
        return 'https://api.cohere.ai/v1'; // Direct Cohere API
      case 'auth':
        return process.env.EXPO_PUBLIC_SUPABASE_URL || '';
      default:
        return '';
    }
  }

  /**
   * Perform health check on backend
   */
  async performHealthCheck(): Promise<BackendHealthStatus> {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.backendTimeout);
      
      const response = await fetch(`${this.config.backendUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        const responseTime = Date.now() - startTime;
        
        this.healthStatus = {
          isHealthy: true,
          lastChecked: new Date(),
          responseTime,
          version: data.version,
          features: data.features,
        };
        
        logger.debug('Backend health check passed', {
          responseTime,
          version: data.version,
        });
      } else {
        throw new Error(`Health check failed: ${response.status}`);
      }
    } catch (error) {
      this.healthStatus = {
        isHealthy: false,
        lastChecked: new Date(),
      };
      
      logger.warn('Backend health check failed', { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
    
    return this.healthStatus;
  }

  /**
   * Start periodic health monitoring
   */
  private startHealthMonitoring(): void {
    // Perform initial health check
    this.performHealthCheck();
    
    // Set up periodic health checks
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);
    
    logger.debug('Backend health monitoring started', {
      interval: this.config.healthCheckInterval,
      url: this.config.backendUrl,
    });
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }
  }

  /**
   * Update configuration dynamically
   */
  updateConfig(newConfig: Partial<APIConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart health monitoring if mode changed
    if (newConfig.mode) {
      this.stopHealthMonitoring();
      if (this.config.mode === 'auto' || this.config.mode === 'backend') {
        this.startHealthMonitoring();
      }
    }
    
    logger.debug('API configuration updated', this.config);
  }

  /**
   * Force switch to direct API mode (emergency fallback)
   */
  forceSwitchToDirect(): void {
    this.updateConfig({ mode: 'direct' });
    logger.info('Switched to direct API mode');
  }

  /**
   * Try to reconnect to backend
   */
  async reconnectToBackend(): Promise<boolean> {
    const health = await this.performHealthCheck();
    if (health.isHealthy && this.config.mode === 'direct') {
      this.updateConfig({ mode: 'auto' });
      logger.info('Reconnected to backend, switched to auto mode');
      return true;
    }
    return false;
  }

  /**
   * Get configuration summary for debugging
   */
  getDebugInfo() {
    return {
      config: this.config,
      health: this.healthStatus,
      endpoints: {
        auth: this.getEndpoint('auth', ''),
        ai: this.getEndpoint('ai', ''),
        backend: this.config.backendUrl,
      },
    };
  }
}

export const apiConfigService = new APIConfigurationService();