/**
 * Shared Library Exports
 * Centralized exports for error handling and telemetry
 */

// Error system exports
export {
  AppError,
  NetworkError,
  AuthenticationError,
  ValidationError,
  BusinessLogicError,
  ExternalServiceError,
  ErrorMappers,
  ErrorContext,
  ErrorUtils,
} from './errors';

// Telemetry system exports
export {
  telemetry,
  logger,
  analytics,
  TelemetryPatterns,
  TelemetryConfig,
} from './telemetry';

// Type exports
export type {
  Logger,
  AnalyticsEvent,
  AnalyticsProvider,
} from './telemetry';