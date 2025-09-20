/**
 * Backend Authentication Service
 * Handles authentication with the FastAPI backend
 */

import { logger } from '../utils/logger';

export interface BackendAuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: number;
    email: string;
    full_name: string;
    tier: string;
    total_savings: number;
    email_verified: boolean;
    created_at: string;
    last_login: string | null;
  };
}

class BackendAuthService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://budget-buddy-mobile.onrender.com';
    logger.info('BackendAuthService initialized', { baseUrl: this.baseUrl });
  }

  async login(email: string, password: string): Promise<{ user: any; tokens: any }> {
    try {
      logger.info('Attempting backend login', { email });
      
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      logger.info('Backend login response', { 
        status: response.status, 
        statusText: response.statusText,
        url: response.url 
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Backend login failed', { 
          status: response.status, 
          error: errorText 
        });
        throw new Error(`Login failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data: BackendAuthResponse = await response.json();
      
      if (!data.user || !data.access_token) {
        logger.error('Backend login invalid response', data);
        throw new Error('Invalid response from server');
      }

      const user = {
        id: data.user.id.toString(),
        email: data.user.email,
        name: data.user.full_name,
        tier: data.user.tier,
        createdAt: data.user.created_at,
        emailVerified: data.user.email_verified,
      };

      const tokens = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: Date.now() + (data.expires_in * 1000),
      };

      logger.info('Backend login successful', { userId: user.id });
      return { user, tokens };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('Backend login error', { error: errorMessage, email });
      throw error;
    }
  }

  async register(email: string, password: string, fullName: string): Promise<{ user: any; tokens: any }> {
    try {
      logger.info('Attempting backend registration', { email, fullName });
      
      const response = await fetch(`${this.baseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
        }),
      });

      logger.info('Backend registration response', { 
        status: response.status, 
        statusText: response.statusText 
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Backend registration failed', { 
          status: response.status, 
          error: errorText 
        });
        throw new Error(`Registration failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data: BackendAuthResponse = await response.json();
      
      if (!data.user || !data.access_token) {
        logger.error('Backend registration invalid response', data);
        throw new Error('Invalid response from server');
      }

      const user = {
        id: data.user.id.toString(),
        email: data.user.email,
        name: data.user.full_name,
        tier: data.user.tier,
        createdAt: data.user.created_at,
        emailVerified: data.user.email_verified,
      };

      const tokens = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: Date.now() + (data.expires_in * 1000),
      };

      logger.info('Backend registration successful', { userId: user.id });
      return { user, tokens };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('Backend registration error', { error: errorMessage, email });
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      logger.info('Backend logout');
      // For backend logout, we don't need to call the server
      // Just clear local tokens
    } catch (error) {
      logger.warn('Backend logout warning', error);
      // Don't throw error for logout - always succeed locally
    }
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/validate`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch (error) {
      logger.error('Backend token validation failed', error);
      return false;
    }
  }
}

export default BackendAuthService;