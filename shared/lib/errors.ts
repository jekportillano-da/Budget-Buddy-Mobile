/**
 * Error Mapping & Application Error System
 * Centralized error handling with type-safe error categories
 */

// Base application error class
export class AppError extends Error {
  public readonly code: string;
  public readonly severity: 'low' | 'medium' | 'high' | 'critical';
  public readonly context?: Record<string, any>;
  public readonly timestamp: Date;
  public readonly userMessage?: string;

  constructor(
    message: string,
    code: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    context?: Record<string, any>,
    userMessage?: string
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.severity = severity;
    this.context = context;
    this.timestamp = new Date();
    this.userMessage = userMessage;

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      userMessage: this.userMessage,
      stack: this.stack,
    };
  }
}

// Specific error types
export class NetworkError extends AppError {
  constructor(
    message: string,
    statusCode?: number,
    context?: Record<string, any>
  ) {
    super(
      message,
      `NETWORK_ERROR_${statusCode || 'UNKNOWN'}`,
      statusCode && statusCode >= 500 ? 'high' : 'medium',
      { statusCode, ...context },
      'Network connection issue. Please check your internet connection and try again.'
    );
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(
      message,
      'AUTH_ERROR',
      'high',
      context,
      'Authentication failed. Please log in again.'
    );
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    field?: string,
    context?: Record<string, any>
  ) {
    super(
      message,
      'VALIDATION_ERROR',
      'low',
      { field, ...context },
      'Please check your input and try again.'
    );
    this.name = 'ValidationError';
  }
}

export class BusinessLogicError extends AppError {
  constructor(
    message: string,
    code: string,
    context?: Record<string, any>,
    userMessage?: string
  ) {
    super(message, code, 'medium', context, userMessage);
    this.name = 'BusinessLogicError';
  }
}

export class ExternalServiceError extends AppError {
  constructor(
    service: string,
    message: string,
    context?: Record<string, any>
  ) {
    super(
      message,
      `EXTERNAL_SERVICE_ERROR_${service.toUpperCase()}`,
      'high',
      { service, ...context },
      'External service is temporarily unavailable. Please try again later.'
    );
    this.name = 'ExternalServiceError';
  }
}

// Error mappers for common scenarios
export const ErrorMappers = {
  // Map HTTP response errors to AppError instances
  fromHttpResponse: (
    response: { status: number; statusText: string },
    responseBody?: any
  ): AppError => {
    const { status, statusText } = response;

    if (status === 401 || status === 403) {
      return new AuthenticationError(
        `Authentication failed: ${statusText}`,
        { status, statusText, responseBody }
      );
    }

    if (status >= 400 && status < 500) {
      return new ValidationError(
        `Client error: ${statusText}`,
        undefined,
        { status, statusText, responseBody }
      );
    }

    if (status >= 500) {
      return new NetworkError(
        `Server error: ${statusText}`,
        status,
        { statusText, responseBody }
      );
    }

    return new NetworkError(`HTTP error: ${statusText}`, status, {
      statusText,
      responseBody,
    });
  },

  // Map JavaScript errors to AppError instances
  fromJavaScriptError: (error: Error): AppError => {
    if (error instanceof AppError) {
      return error;
    }

    // Network-related errors
    if (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('timeout')
    ) {
      return new NetworkError(error.message, undefined, {
        originalError: error.name,
        stack: error.stack,
      });
    }

    // Generic mapping
    return new AppError(
      error.message,
      'UNKNOWN_ERROR',
      'medium',
      {
        originalError: error.name,
        stack: error.stack,
      },
      'An unexpected error occurred. Please try again.'
    );
  },

  // Map Zod validation errors to AppError instances  
  fromZodError: (error: any): ValidationError => {
    const issues = error.issues || [];
    const firstIssue = issues[0];
    
    return new ValidationError(
      `Validation failed: ${firstIssue?.message || 'Invalid data format'}`,
      firstIssue?.path?.join('.'),
      {
        zodIssues: issues,
        zodError: error.name,
      }
    );
  },

  // Map external service errors (e.g., AI service failures)
  fromExternalService: (
    serviceName: string,
    error: Error | string
  ): ExternalServiceError => {
    const message = typeof error === 'string' ? error : error.message;
    const context = typeof error === 'object' ? { stack: error.stack } : {};

    return new ExternalServiceError(serviceName, message, context);
  },
};

// Error context helpers
export const ErrorContext = {
  // Add user context to errors
  withUser: (userId?: string, userTier?: string) => ({
    userId,
    userTier,
  }),

  // Add request context to errors
  withRequest: (endpoint?: string, method?: string, params?: any) => ({
    endpoint,
    method,
    params,
  }),

  // Add feature context to errors
  withFeature: (feature: string, action?: string) => ({
    feature,
    action,
  }),
};

// Error utility functions
export const ErrorUtils = {
  // Check if error should trigger user notification
  shouldNotifyUser: (error: AppError): boolean => {
    return error.severity === 'high' || error.severity === 'critical';
  },

  // Check if error should be logged to external service
  shouldLogExternal: (error: AppError): boolean => {
    return error.severity === 'high' || error.severity === 'critical';
  },

  // Get user-friendly message from error
  getUserMessage: (error: AppError): string => {
    return error.userMessage || 'An unexpected error occurred. Please try again.';
  },

  // Sanitize error for logging (remove sensitive data)
  sanitizeForLogging: (error: AppError): Record<string, any> => {
    const sanitized = { ...error.toJSON() };
    
    // Remove potentially sensitive data
    if (sanitized.context) {
      delete sanitized.context.password;
      delete sanitized.context.token;
      delete sanitized.context.apiKey;
    }

    return sanitized;
  },
};