/**
 * Auth Client Validation
 * Basic validation for auth schemas and client functionality
 */

import { TokenResponseSchema, UserResponseSchema, HealthResponseSchema } from '../schemas/auth';
import { AuthClient } from '../clients/authClient';

// Mock data matching the expected backend format
const mockUserResponse = {
  id: 123,
  email: 'test@example.com',
  full_name: 'Test User',
  tier: 'premium',
  total_savings: 1000.50,
  email_verified: true,
  created_at: '2024-01-01T00:00:00Z',
  last_login: '2024-01-02T00:00:00Z',
};

const mockTokenResponse = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  token_type: 'bearer',
  expires_in: 3600,
  user: mockUserResponse,
};

// Basic validation functions
export function validateSchemas(): void {
  console.log('Validating auth schemas...');

  // Test UserResponseSchema
  const userResult = UserResponseSchema.safeParse(mockUserResponse);
  if (!userResult.success) {
    throw new Error(`UserResponseSchema validation failed: ${JSON.stringify(userResult.error)}`);
  }
  console.log('✓ UserResponseSchema validation passed');

  // Test TokenResponseSchema
  const tokenResult = TokenResponseSchema.safeParse(mockTokenResponse);
  if (!tokenResult.success) {
    throw new Error(`TokenResponseSchema validation failed: ${JSON.stringify(tokenResult.error)}`);
  }
  console.log('✓ TokenResponseSchema validation passed');

  // Test HealthResponseSchema
  const healthData = { status: 'ok' };
  const healthResult = HealthResponseSchema.safeParse(healthData);
  if (!healthResult.success) {
    throw new Error(`HealthResponseSchema validation failed: ${JSON.stringify(healthResult.error)}`);
  }
  console.log('✓ HealthResponseSchema validation passed');

  // Test invalid data rejection
  const invalidUser = { ...mockUserResponse, email: 'invalid-email' };
  const invalidResult = UserResponseSchema.safeParse(invalidUser);
  if (invalidResult.success) {
    throw new Error('Schema should have rejected invalid email');
  }
  console.log('✓ Schema correctly rejects invalid data');
}

export function validateAuthClient(): void {
  console.log('Validating AuthClient transformation...');

  const authClient = new AuthClient();
  const result = authClient.transformToCurrentFormat(mockTokenResponse);

  // Validate transformation
  if (result.user.id !== '123') {
    throw new Error(`Expected user id '123', got '${result.user.id}'`);
  }
  if (result.user.name !== 'Test User') {
    throw new Error(`Expected user name 'Test User', got '${result.user.name}'`);
  }
  if (result.tokens.accessToken !== 'mock-access-token') {
    throw new Error(`Expected access token 'mock-access-token', got '${result.tokens.accessToken}'`);
  }
  if (typeof result.tokens.expiresAt !== 'number' || result.tokens.expiresAt <= Date.now()) {
    throw new Error('Expected valid expiration timestamp');
  }

  console.log('✓ AuthClient transformation validation passed');
}

// Run validation if this file is executed directly
if (require.main === module) {
  try {
    validateSchemas();
    validateAuthClient();
    console.log('All validations passed! ✅');
  } catch (error) {
    console.error('Validation failed:', error);
    process.exit(1);
  }
}