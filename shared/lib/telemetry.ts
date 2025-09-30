/**
 * Telemetry & Logging System
 * Centralized logging with optional analytics integration
 */

import { AppError } from './errors';

// Enhanced logger interface
export interface Logger {
  debug(message: string, context?: Record<string, any>): void;
  info(message: string, context?: Record<string, any>): void;
  warn(message: string, context?: Record<string, any>): void;
  error(message: string, error?: Error | AppError, context?: Record<string, any>): void;
}

// Analytics event interface
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  userId?: string;
  timestamp?: Date;
}

// Analytics provider interface
export interface AnalyticsProvider {
  track(event: AnalyticsEvent): Promise<void>;
  identify(userId: string, traits?: Record<string, any>): Promise<void>;
  flush?(): Promise<void>;
}

// Environment-safe global check
const getGlobalThis = (): any => {
  if (typeof globalThis !== 'undefined') return globalThis;
  if (typeof window !== 'undefined') return window;
  if (typeof global !== 'undefined') return global;
  if (typeof self !== 'undefined') return self;
  return {};
};

// Safe development mode check
const isDevelopment = (): boolean => {
  const globalScope = getGlobalThis();
  
  // React Native environment
  if (globalScope.__DEV__ !== undefined) {
    return globalScope.__DEV__;
  }
  
  // Node.js environment
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV === 'development';
  }
  
  // Default to false for safety
  return false;
};

// Enhanced console logger with context
class EnhancedConsoleLogger implements Logger {
  private isDev = isDevelopment();

  private formatMessage(level: string, message: string, context?: Record<string, any>): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  debug(message: string, context?: Record<string, any>): void {
    if (this.isDev && console.debug) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: Record<string, any>): void {
    if (console.info) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: Record<string, any>): void {
    if (console.warn) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  error(message: string, error?: Error | AppError, context?: Record<string, any>): void {
    const errorContext = {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        code: error instanceof AppError ? error.code : undefined,
        severity: error instanceof AppError ? error.severity : undefined,
        stack: this.isDev ? error.stack : undefined,
      } : undefined,
    };

    if (console.error) {
      console.error(this.formatMessage('error', message, errorContext));
    }
  }
}

// Telemetry manager
class TelemetryManager {
  private logger: Logger = new EnhancedConsoleLogger();
  private analyticsProvider?: AnalyticsProvider;
  private globalContext: Record<string, any> = {};

  // Set custom logger
  setLogger(logger: Logger): void {
    this.logger = logger;
  }

  // Set analytics provider
  setAnalyticsProvider(provider: AnalyticsProvider): void {
    this.analyticsProvider = provider;
  }

  // Set global context that gets added to all events
  setGlobalContext(context: Record<string, any>): void {
    this.globalContext = { ...this.globalContext, ...context };
  }

  // Clear global context
  clearGlobalContext(): void {
    this.globalContext = {};
  }

  // Logging methods with context enhancement
  debug(message: string, context?: Record<string, any>): void {
    this.logger.debug(message, { ...this.globalContext, ...context });
  }

  info(message: string, context?: Record<string, any>): void {
    this.logger.info(message, { ...this.globalContext, ...context });
  }

  warn(message: string, context?: Record<string, any>): void {
    this.logger.warn(message, { ...this.globalContext, ...context });
  }

  error(message: string, error?: Error | AppError, context?: Record<string, any>): void {
    this.logger.error(message, error, { ...this.globalContext, ...context });
  }

  // Analytics tracking
  async track(eventName: string, properties?: Record<string, any>, userId?: string): Promise<void> {
    const event: AnalyticsEvent = {
      name: eventName,
      properties: { ...this.globalContext, ...properties },
      userId,
      timestamp: new Date(),
    };

    // Log the event
    this.debug(`Analytics Event: ${eventName}`, event.properties);

    // Send to analytics provider if available
    if (this.analyticsProvider) {
      try {
        await this.analyticsProvider.track(event);
      } catch (error) {
        this.error('Failed to track analytics event', error instanceof Error ? error : new Error(String(error)), {
          eventName,
          properties: event.properties,
        });
      }
    }
  }

  // User identification for analytics
  async identify(userId: string, traits?: Record<string, any>): Promise<void> {
    this.debug(`User identified: ${userId}`, traits);

    if (this.analyticsProvider) {
      try {
        await this.analyticsProvider.identify(userId, traits);
      } catch (error) {
        this.error('Failed to identify user', error instanceof Error ? error : new Error(String(error)), {
          userId,
          traits,
        });
      }
    }
  }

  // Flush analytics events
  async flush(): Promise<void> {
    if (this.analyticsProvider?.flush) {
      try {
        await this.analyticsProvider.flush();
      } catch (error) {
        this.error('Failed to flush analytics events', error instanceof Error ? error : new Error(String(error)));
      }
    }
  }
}

// Global telemetry instance
export const telemetry = new TelemetryManager();

// Convenience functions that wrap the global telemetry instance
export const logger = {
  debug: (message: string, context?: Record<string, any>) => telemetry.debug(message, context),
  info: (message: string, context?: Record<string, any>) => telemetry.info(message, context),
  warn: (message: string, context?: Record<string, any>) => telemetry.warn(message, context),
  error: (message: string, error?: Error | AppError, context?: Record<string, any>) => 
    telemetry.error(message, error, context),
};

// Analytics convenience functions
export const analytics = {
  track: (eventName: string, properties?: Record<string, any>, userId?: string) =>
    telemetry.track(eventName, properties, userId),
  identify: (userId: string, traits?: Record<string, any>) =>
    telemetry.identify(userId, traits),
  flush: () => telemetry.flush(),
};

// Common telemetry patterns
export const TelemetryPatterns = {
  // Log user actions
  userAction: (action: string, userId?: string, context?: Record<string, any>) => {
    telemetry.info(`User action: ${action}`, { userId, ...context });
    telemetry.track('user_action', { action, ...context }, userId);
  },

  // Log feature usage
  featureUsage: (feature: string, userId?: string, context?: Record<string, any>) => {
    telemetry.info(`Feature used: ${feature}`, { userId, ...context });
    telemetry.track('feature_usage', { feature, ...context }, userId);
  },

  // Log API calls
  apiCall: (endpoint: string, method: string, duration?: number, statusCode?: number, context?: Record<string, any>) => {
    telemetry.info(`API call: ${method} ${endpoint}`, { duration, statusCode, ...context });
    telemetry.track('api_call', { endpoint, method, duration, statusCode, ...context });
  },

  // Log errors with automatic tracking
  errorOccurred: (error: AppError, userId?: string, context?: Record<string, any>) => {
    telemetry.error(`Error occurred: ${error.code}`, error, { userId, ...context });
    telemetry.track('error_occurred', {
      errorCode: error.code,
      errorSeverity: error.severity,
      errorMessage: error.message,
      ...context,
    }, userId);
  },

  // Log performance metrics
  performance: (metric: string, value: number, unit: string, context?: Record<string, any>) => {
    telemetry.info(`Performance metric: ${metric} = ${value}${unit}`, context);
    telemetry.track('performance_metric', { metric, value, unit, ...context });
  },
};

// Configuration helpers
export const TelemetryConfig = {
  // Initialize telemetry with common app context
  initialize: (appVersion: string, userId?: string, environment?: string) => {
    telemetry.setGlobalContext({
      appVersion,
      environment: environment || (isDevelopment() ? 'development' : 'production'),
      platform: typeof window !== 'undefined' ? 'web' : 'mobile',
    });

    if (userId) {
      telemetry.identify(userId);
    }

    telemetry.info('Telemetry initialized', { appVersion, userId, environment });
  },

  // Setup analytics provider
  setupAnalytics: (provider: AnalyticsProvider) => {
    telemetry.setAnalyticsProvider(provider);
    telemetry.info('Analytics provider configured');
  },

  // Setup custom logger
  setupLogger: (logger: Logger) => {
    telemetry.setLogger(logger);
    telemetry.info('Custom logger configured');
  },
};