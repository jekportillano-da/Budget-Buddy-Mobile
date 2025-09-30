/**
 * Health Query Hook Validation
 * Basic validation for health query functionality
 */

import { useHealthQuery, useHealthStatus } from '../useHealthQuery';

export function validateHealthQuery(): void {
  console.log('Validating health query hook setup...');

  // Check if hooks are exported correctly
  if (typeof useHealthQuery !== 'function') {
    throw new Error('useHealthQuery should be a function');
  }

  if (typeof useHealthStatus !== 'function') {
    throw new Error('useHealthStatus should be a function');
  }

  console.log('✓ Health query hooks are properly exported');
  
  // Note: We can't test the actual hook execution here without a React environment
  // This validation just ensures the hooks are properly structured and exported
  
  console.log('✓ Health query hook structure validation passed');
}

// Mock test to validate hook options interface
export function validateHealthQueryOptions(): void {
  // Test that options are properly typed (TypeScript compile-time check)
  const validOptions = {
    enabled: true,
    refetchInterval: 30000,
  };

  const defaultOptions = {};

  // These should compile without errors if types are correct
  const _testOptions1: Parameters<typeof useHealthQuery>[0] = validOptions;
  const _testOptions2: Parameters<typeof useHealthQuery>[0] = defaultOptions;
  const _testOptions3: Parameters<typeof useHealthQuery>[0] = undefined;

  console.log('✓ Health query options interface validation passed');
}

// Run validation if this file is executed directly
if (require.main === module) {
  try {
    validateHealthQuery();
    validateHealthQueryOptions();
    console.log('All health query hook validations passed! ✅');
  } catch (error) {
    console.error('Health query hook validation failed:', error);
    process.exit(1);
  }
}