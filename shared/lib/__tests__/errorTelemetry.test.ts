/**
 * Error and Telemetry System Validation
 * Simple tests to ensure core functionality works
 */

export function validateErrorSystem(): void {
  console.log('Validating error system...');

  try {
    // Import error classes
    const { 
      AppError, 
      NetworkError, 
      AuthenticationError, 
      ValidationError, 
      ErrorMappers,
      ErrorUtils 
    } = require('../errors');

    // Test basic AppError
    const basicError = new AppError('Test error', 'TEST_CODE', 'medium');
    if (basicError.code !== 'TEST_CODE') {
      throw new Error('AppError code should match constructor');
    }
    if (basicError.severity !== 'medium') {
      throw new Error('AppError severity should match constructor');
    }
    console.log('✓ AppError basic functionality works');

    // Test NetworkError
    const networkError = new NetworkError('Network failed', 500);
    if (networkError.name !== 'NetworkError') {
      throw new Error('NetworkError name should be NetworkError');
    }
    if (!networkError.code.includes('NETWORK_ERROR')) {
      throw new Error('NetworkError should have NETWORK_ERROR code');
    }
    console.log('✓ NetworkError functionality works');

    // Test AuthenticationError
    const authError = new AuthenticationError('Auth failed');
    if (authError.code !== 'AUTH_ERROR') {
      throw new Error('AuthenticationError should have AUTH_ERROR code');
    }
    if (authError.severity !== 'high') {
      throw new Error('AuthenticationError should be high severity');
    }
    console.log('✓ AuthenticationError functionality works');

    // Test ValidationError
    const validationError = new ValidationError('Validation failed', 'email');
    if (validationError.code !== 'VALIDATION_ERROR') {
      throw new Error('ValidationError should have VALIDATION_ERROR code');
    }
    if (validationError.severity !== 'low') {
      throw new Error('ValidationError should be low severity');
    }
    console.log('✓ ValidationError functionality works');

    // Test ErrorMappers
    const httpError = ErrorMappers.fromHttpResponse({ status: 401, statusText: 'Unauthorized' });
    console.log('HTTP Error type:', httpError.constructor.name, httpError instanceof AuthenticationError);
    if (httpError.name !== 'AuthenticationError') {
      throw new Error(`401 status should map to AuthenticationError, got ${httpError.name}`);
    }

    const jsError = ErrorMappers.fromJavaScriptError(new Error('Generic error'));
    if (!(jsError instanceof AppError)) {
      throw new Error('JS Error should map to AppError');
    }
    console.log('✓ ErrorMappers functionality works');

    // Test ErrorUtils
    const highSeverityError = new AppError('Test', 'TEST', 'high');
    if (!ErrorUtils.shouldNotifyUser(highSeverityError)) {
      throw new Error('High severity error should trigger user notification');
    }

    const userMessage = ErrorUtils.getUserMessage(basicError);
    if (typeof userMessage !== 'string') {
      throw new Error('getUserMessage should return string');
    }
    console.log('✓ ErrorUtils functionality works');

    console.log('✓ Error system validation passed');

  } catch (error) {
    throw new Error(`Error system validation failed: ${error}`);
  }
}

export function validateTelemetrySystem(): void {
  console.log('Validating telemetry system...');

  try {
    // Import telemetry modules
    const { 
      telemetry, 
      logger, 
      analytics, 
      TelemetryPatterns,
      TelemetryConfig 
    } = require('../telemetry');

    // Test basic logger functions
    if (typeof logger.debug !== 'function') {
      throw new Error('logger.debug should be a function');
    }
    if (typeof logger.info !== 'function') {
      throw new Error('logger.info should be a function');
    }
    if (typeof logger.warn !== 'function') {
      throw new Error('logger.warn should be a function');
    }
    if (typeof logger.error !== 'function') {
      throw new Error('logger.error should be a function');
    }
    console.log('✓ Logger interface works');

    // Test basic analytics functions
    if (typeof analytics.track !== 'function') {
      throw new Error('analytics.track should be a function');
    }
    if (typeof analytics.identify !== 'function') {
      throw new Error('analytics.identify should be a function');
    }
    if (typeof analytics.flush !== 'function') {
      throw new Error('analytics.flush should be a function');
    }
    console.log('✓ Analytics interface works');

    // Test telemetry patterns
    if (typeof TelemetryPatterns.userAction !== 'function') {
      throw new Error('TelemetryPatterns.userAction should be a function');
    }
    if (typeof TelemetryPatterns.featureUsage !== 'function') {
      throw new Error('TelemetryPatterns.featureUsage should be a function');
    }
    if (typeof TelemetryPatterns.apiCall !== 'function') {
      throw new Error('TelemetryPatterns.apiCall should be a function');
    }
    console.log('✓ TelemetryPatterns interface works');

    // Test telemetry config
    if (typeof TelemetryConfig.initialize !== 'function') {
      throw new Error('TelemetryConfig.initialize should be a function');
    }
    if (typeof TelemetryConfig.setupAnalytics !== 'function') {
      throw new Error('TelemetryConfig.setupAnalytics should be a function');
    }
    console.log('✓ TelemetryConfig interface works');

    // Test telemetry manager
    if (typeof telemetry.setGlobalContext !== 'function') {
      throw new Error('telemetry.setGlobalContext should be a function');
    }
    if (typeof telemetry.debug !== 'function') {
      throw new Error('telemetry.debug should be a function');
    }
    console.log('✓ Telemetry manager interface works');

    console.log('✓ Telemetry system validation passed');

  } catch (error) {
    throw new Error(`Telemetry system validation failed: ${error}`);
  }
}

export function validateLibraryIndex(): void {
  console.log('Validating library index...');

  try {
    // Test that index file exports work
    const libIndex = require('../index');

    // Check error exports
    if (!libIndex.AppError) {
      throw new Error('AppError should be exported from index');
    }
    if (!libIndex.ErrorMappers) {
      throw new Error('ErrorMappers should be exported from index');
    }

    // Check telemetry exports
    if (!libIndex.logger) {
      throw new Error('logger should be exported from index');
    }
    if (!libIndex.analytics) {
      throw new Error('analytics should be exported from index');
    }
    if (!libIndex.TelemetryPatterns) {
      throw new Error('TelemetryPatterns should be exported from index');
    }

    console.log('✓ Library index validation passed');

  } catch (error) {
    throw new Error(`Library index validation failed: ${error}`);
  }
}

// Run validation if this file is executed directly
if (require.main === module) {
  try {
    validateErrorSystem();
    validateTelemetrySystem();
    validateLibraryIndex();
    console.log('All Error & Telemetry validations passed! ✅');
  } catch (error) {
    console.error('Error & Telemetry validation failed:', error);
    process.exit(1);
  }
}