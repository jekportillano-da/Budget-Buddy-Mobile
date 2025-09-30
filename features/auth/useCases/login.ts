/**
 * Login Use Case
 * Feature-sliced authentication logic using typed auth client
 */

import { authClient } from '../../../shared/api/clients/authClient';
import { logger as utilLogger } from '../../../utils/logger';
import { logger, TelemetryPatterns, ErrorMappers, ValidationError, AppError } from '../../../shared/lib';
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

      // Use both old and new logging for compatibility
      utilLogger.info('Login attempt started', { 
        email: loginRequest.email,
        hasPassword: !!password,
        timestamp: new Date().toISOString(),
      });

      // New telemetry patterns
      TelemetryPatterns.userAction('login_attempt', undefined, {
        email: loginRequest.email,
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

      // Success logging with both systems
      utilLogger.info('Login successful', { 
        userId: result.user.id,
        userTier: result.user.tier,
        tokenExpiry: new Date(result.tokens.expiresAt).toISOString(),
      });

      TelemetryPatterns.userAction('login_success', result.user.id, {
        userTier: result.user.tier,
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

      // Use legacy logger for compatibility
      utilLogger.error('Login failed', errorContext);

      // Map error using our new error system
      let mappedError: AppError;
      
      if (error instanceof AppError) {
        mappedError = error;
      } else if (error instanceof Error) {
        mappedError = ErrorMappers.fromJavaScriptError(error);
      } else {
        mappedError = new AppError(
          'Unknown login error',
          'LOGIN_UNKNOWN_ERROR',
          'medium',
          { originalError: error }
        );
      }

      // Log error with new telemetry system
      TelemetryPatterns.errorOccurred(mappedError, undefined, {
        feature: 'auth',
        action: 'login',
        email: email.trim().toLowerCase(),
      });

      // Track failed login attempt
      TelemetryPatterns.userAction('login_failure', undefined, {
        errorCode: mappedError.code,
        errorMessage: mappedError.message,
      });

      throw mappedError;
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
   * Throws ValidationError for invalid inputs
   */
  static validateCredentials(email: string, password: string): void {
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

    if (errors.length > 0) {
      throw new ValidationError(
        `Invalid login credentials: ${errors.join(', ')}`,
        'credentials',
        { validationErrors: errors }
      );
    }
  }

  /**
   * Legacy validation method for backwards compatibility
   */
  static validateCredentialsLegacy(email: string, password: string): {
    isValid: boolean;
    errors: string[];
  } {
    try {
      this.validateCredentials(email, password);
      return { isValid: true, errors: [] };
    } catch (error) {
      if (error instanceof ValidationError && error.context?.validationErrors) {
        return { 
          isValid: false, 
          errors: error.context.validationErrors as string[] 
        };
      }
      return { isValid: false, errors: ['Validation failed'] };
    }
  }
}

// Export convenience instance
export const loginUseCase = new LoginUseCase();