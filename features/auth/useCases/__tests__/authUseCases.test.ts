/**
 * Auth Use Cases Validation
 * Basic validation for login and register use cases (lightweight version)
 */

// Simple validation without dependencies to avoid import issues in testing
export function validateAuthUseCases(): void {
  console.log('Validating auth use cases...');

  // Test validation functions directly (these don't require dependencies)
  try {
    // Import validation functions only
    const { LoginUseCase } = require('../login');
    const { RegisterUseCase } = require('../register');

    // Test credential validation
    const loginValidation = LoginUseCase.validateCredentials('test@example.com', 'password123');
    if (!loginValidation.isValid) {
      throw new Error('Valid credentials should pass validation');
    }

    const invalidLoginValidation = LoginUseCase.validateCredentials('invalid-email', '123');
    if (invalidLoginValidation.isValid) {
      throw new Error('Invalid credentials should fail validation');
    }

    console.log('✓ Login credential validation working correctly');

    // Test registration validation
    const registerValidation = RegisterUseCase.validateRegistrationData(
      'test@example.com', 
      'password123', 
      'John Doe'
    );
    if (!registerValidation.isValid) {
      throw new Error('Valid registration data should pass validation');
    }

    const invalidRegisterValidation = RegisterUseCase.validateRegistrationData(
      'invalid-email', 
      '123', 
      ''
    );
    if (invalidRegisterValidation.isValid) {
      throw new Error('Invalid registration data should fail validation');
    }

    console.log('✓ Registration data validation working correctly');

    // Test various validation scenarios
    const emptyEmailValidation = LoginUseCase.validateCredentials('', 'password');
    if (!emptyEmailValidation.errors.some((error: string) => error.includes('required'))) {
      throw new Error('Should show required error for empty email');
    }

    const invalidEmailValidation = LoginUseCase.validateCredentials('not-an-email', 'password');
    if (!invalidEmailValidation.errors.some((error: string) => error.includes('valid email'))) {
      throw new Error('Should show invalid email error');
    }

    const shortPasswordValidation = LoginUseCase.validateCredentials('test@example.com', '123');
    if (!shortPasswordValidation.errors.some((error: string) => error.includes('6 characters'))) {
      throw new Error('Should show short password error');
    }

    console.log('✓ Validation error messages are working correctly');

  } catch (error) {
    throw new Error(`Auth use case validation failed: ${error}`);
  }
}

// Run validation if this file is executed directly
if (require.main === module) {
  try {
    validateAuthUseCases();
    console.log('All auth use case validations passed! ✅');
  } catch (error) {
    console.error('Auth use case validation failed:', error);
    process.exit(1);
  }
}