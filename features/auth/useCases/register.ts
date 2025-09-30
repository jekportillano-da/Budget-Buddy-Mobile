/**
 * Register Use Case
 * Feature-sliced registration logic using typed auth client
 */

import { authClient } from '../../../shared/api/clients/authClient';
import { logger } from '../../../utils/logger';
import type { RegisterRequest } from '../../../shared/api/schemas/auth';
import type { LoginResult } from './login';

export interface RegisterUseCaseOptions {
  onProgress?: (step: string) => void;
  timeout?: number;
}

/**
 * Execute registration with typed validation and comprehensive error handling
 */
export class RegisterUseCase {
  async execute(
    email: string,
    password: string,
    fullName: string,
    options: RegisterUseCaseOptions = {}
  ): Promise<LoginResult> {
    const { onProgress, timeout = 30000 } = options;
    
    try {
      onProgress?.('Validating registration data...');
      
      // Validate input using Zod schema
      const registerRequest: RegisterRequest = {
        email: email.trim().toLowerCase(),
        password,
        full_name: fullName.trim(),
      };

      logger.info('Registration attempt started', { 
        email: registerRequest.email,
        fullName: registerRequest.full_name,
        hasPassword: !!password,
        timestamp: new Date().toISOString(),
      });

      onProgress?.('Creating account...');

      // Execute registration with timeout
      const tokenResponse = await this.executeWithTimeout(
        () => authClient.register(registerRequest),
        timeout
      );

      onProgress?.('Processing registration response...');

      // Transform response to match existing auth store format
      const result = authClient.transformToCurrentFormat(tokenResponse);

      logger.info('Registration successful', { 
        userId: result.user.id,
        userTier: result.user.tier,
        tokenExpiry: new Date(result.tokens.expiresAt).toISOString(),
      });

      onProgress?.('Registration complete');
      
      return result;

    } catch (error) {
      // Enhanced error logging with context
      const errorContext = {
        email: email.trim().toLowerCase(),
        fullName: fullName.trim(),
        timestamp: new Date().toISOString(),
        errorType: error?.constructor?.name || 'Unknown',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };

      logger.error('Registration failed', errorContext);

      // Re-throw with additional context but preserve original error
      if (error instanceof Error) {
        // Add more context to common errors
        if (error.message.includes('409') || error.message.includes('already exists')) {
          throw new Error('An account with this email already exists. Please try logging in instead.');
        }
        if (error.message.includes('400') || error.message.includes('Bad Request')) {
          throw new Error('Invalid registration data. Please check your information and try again.');
        }
        if (error.message.includes('timeout') || error.message.includes('408')) {
          throw new Error('Registration request timed out. Please check your internet connection and try again.');
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
   * Validate registration data before making request
   */
  static validateRegistrationData(email: string, password: string, fullName: string): {
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

    if (!fullName?.trim()) {
      errors.push('Full name is required');
    } else if (fullName.trim().length < 2) {
      errors.push('Full name must be at least 2 characters long');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Export convenience instance
export const registerUseCase = new RegisterUseCase();