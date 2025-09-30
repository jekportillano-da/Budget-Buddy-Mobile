/**
 * Login Use Case
 * Feature-sliced authentication logic using typed auth client
 */

import { authClient } from '../../../shared/api/clients/authClient';
import { logger } from '../../../utils/logger';
import type { LoginRequest, TokenResponse } from '../../../shared/api/schemas/auth';

export interface LoginResult {
  user: {
    id: string;
    email: string;
    name: string;
    tier: string;
    createdAt: string;
    emailVerified: boolean;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  };
}

export interface LoginUseCaseOptions {
  onProgress?: (step: string) => void;
  timeout?: number;
}

/**
 * Execute login with typed validation and comprehensive error handling
 */
export class LoginUseCase {
  async execute(
    email: string, 
    password: string, 
    options: LoginUseCaseOptions = {}
  ): Promise<LoginResult> {
    const { onProgress, timeout = 30000 } = options;
    
    try {
      onProgress?.('Validating credentials...');
      
      // Validate input using Zod schema
      const loginRequest: LoginRequest = {
        email: email.trim().toLowerCase(),
        password,
      };

      logger.info('Login attempt started', { 
        email: loginRequest.email,
        hasPassword: !!password,
        timestamp: new Date().toISOString(),
      });

      onProgress?.('Authenticating with server...');

      // Execute login with timeout
      const tokenResponse = await this.executeWithTimeout(
        () => authClient.login(loginRequest),
        timeout
      );

      onProgress?.('Processing authentication response...');

      // Transform response to match existing auth store format
      const result = authClient.transformToCurrentFormat(tokenResponse);

      logger.info('Login successful', { 
        userId: result.user.id,
        userTier: result.user.tier,
        tokenExpiry: new Date(result.tokens.expiresAt).toISOString(),
      });

      onProgress?.('Login complete');
      
      return result;

    } catch (error) {
      // Enhanced error logging with context
      const errorContext = {
        email: email.trim().toLowerCase(),
        timestamp: new Date().toISOString(),
        errorType: error?.constructor?.name || 'Unknown',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };

      logger.error('Login failed', errorContext);

      // Re-throw with additional context but preserve original error
      if (error instanceof Error) {
        // Add more context to common errors
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          throw new Error('Invalid email or password. Please check your credentials and try again.');
        }
        if (error.message.includes('timeout') || error.message.includes('408')) {
          throw new Error('Login request timed out. Please check your internet connection and try again.');
        }
        if (error.message.includes('Network') || error.message.includes('fetch')) {
          throw new Error('Unable to connect to server. Please check your internet connection.');
        }
      }

      throw error;
    }
  }

  /**
   * Execute async operation with timeout
   */
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      operation()
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Validate login credentials before making request
   */
  static validateCredentials(email: string, password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!email?.trim()) {
      errors.push('Email is required');
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      errors.push('Please enter a valid email address');
    }

    if (!password) {
      errors.push('Password is required');
    } else if (password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Export convenience instance
export const loginUseCase = new LoginUseCase();