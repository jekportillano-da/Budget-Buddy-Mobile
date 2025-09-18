/**
 * Hybrid API Client for Budget Buddy Mobile
 * Provides unified interface for both backend and direct API calls with automatic fallback
 */

import { apiConfigService } from './apiConfigService';
import { logger } from '../utils/logger';

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  source: 'backend' | 'direct';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export interface AuthCredentials {
  email: string;
  password: string;
  fullName?: string;
}

class HybridAPIClient {
  private authTokens: AuthTokens | null = null;

  /**
   * Make authenticated request with automatic backend/direct fallback
   */
  async request<T>(
    service: 'auth' | 'ai' | 'general',
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const config = apiConfigService.getConfig();
    const useBackend = apiConfigService.shouldUseBackend(service);

    try {
      if (useBackend) {
        return await this.makeBackendRequest<T>(service, endpoint, options);
      } else {
        return await this.makeDirectRequest<T>(service, endpoint, options);
      }
    } catch (error) {
      logger.error('API request failed', { service, endpoint, useBackend, error });
      
      // Try fallback if enabled and we were using backend
      if (config.enableFallback && useBackend) {
        logger.info('Attempting fallback to direct API');
        try {
          return await this.makeDirectRequest<T>(service, endpoint, options);
        } catch (fallbackError) {
          logger.error('Fallback request also failed', { fallbackError });
          return {
            success: false,
            error: 'Both backend and direct API requests failed',
            source: 'direct'
          };
        }
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Request failed',
        source: useBackend ? 'backend' : 'direct'
      };
    }
  }

  /**
   * Make request to backend API
   */
  private async makeBackendRequest<T>(
    service: 'auth' | 'ai' | 'general',
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const baseUrl = apiConfigService.getConfig().backendUrl;
    const url = `${baseUrl}/${service}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    // Add auth token if available
    if (this.authTokens?.accessToken) {
      headers['Authorization'] = `Bearer ${this.authTokens.accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      data,
      source: 'backend'
    };
  }

  /**
   * Make direct API request (legacy behavior)
   */
  private async makeDirectRequest<T>(
    service: 'auth' | 'ai' | 'general',
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    let url: string;
    let headers: Record<string, string> = { ...(options.headers as Record<string, string> || {}) };

    switch (service) {
      case 'ai':
        url = `https://api.cohere.ai/v1${endpoint}`;
        headers = {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_COHERE_API_KEY}`,
          'Content-Type': 'application/json',
          ...headers,
        };
        break;
      
      case 'auth':
        const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseKey) {
          throw new Error('Supabase configuration missing');
        }
        url = `${supabaseUrl}/auth/v1${endpoint}`;
        headers = {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          ...headers,
        };
        break;
      
      default:
        throw new Error(`Direct API not supported for service: ${service}`);
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`Direct API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      data,
      source: 'direct'
    };
  }

  /**
   * Authentication methods
   */
  async register(credentials: AuthCredentials): Promise<APIResponse<AuthTokens>> {
    const response = await this.request<AuthTokens>('auth', '/register', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data) {
      this.setAuthTokens(response.data);
    }

    return response;
  }

  async login(credentials: Omit<AuthCredentials, 'fullName'>): Promise<APIResponse<AuthTokens>> {
    const response = await this.request<AuthTokens>('auth', '/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data) {
      this.setAuthTokens(response.data);
    }

    return response;
  }

  async logout(): Promise<APIResponse<void>> {
    const response = await this.request<void>('auth', '/logout', {
      method: 'POST',
    });

    if (response.success) {
      this.clearAuthTokens();
    }

    return response;
  }

  /**
   * AI service methods
   */
  async chatWithAI(message: string, context?: any): Promise<APIResponse<{ response: string }>> {
    return await this.request('ai', '/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    });
  }

  async getAIInsights(data: any): Promise<APIResponse<any>> {
    return await this.request('ai', '/insights', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAIRecommendations(data: any): Promise<APIResponse<any>> {
    return await this.request('ai', '/recommendations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Token management
   */
  setAuthTokens(tokens: AuthTokens): void {
    this.authTokens = tokens;
    logger.debug('Auth tokens updated');
  }

  clearAuthTokens(): void {
    this.authTokens = null;
    logger.debug('Auth tokens cleared');
  }

  getAuthTokens(): AuthTokens | null {
    return this.authTokens;
  }

  isAuthenticated(): boolean {
    return !!this.authTokens?.accessToken;
  }

  /**
   * Health check and diagnostics
   */
  async healthCheck(): Promise<APIResponse<any>> {
    return await this.request('general', '/health', {
      method: 'GET',
    });
  }

  /**
   * Get API status for debugging
   */
  getApiStatus() {
    const config = apiConfigService.getConfig();
    const health = apiConfigService.getHealthStatus();
    
    return {
      mode: config.mode,
      backendHealthy: health.isHealthy,
      backendUrl: config.backendUrl,
      lastHealthCheck: health.lastChecked,
      isAuthenticated: this.isAuthenticated(),
      config: apiConfigService.getDebugInfo(),
    };
  }

  /**
   * Force switch API mode for testing/debugging
   */
  async switchToDirectMode(): Promise<void> {
    apiConfigService.forceSwitchToDirect();
    logger.info('Switched to direct API mode');
  }

  async reconnectToBackend(): Promise<boolean> {
    return await apiConfigService.reconnectToBackend();
  }
}

export const hybridAPIClient = new HybridAPIClient();