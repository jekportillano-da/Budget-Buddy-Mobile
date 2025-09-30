/**
 * UI Kit Validation
 * Basic validation for design tokens (Node.js compatible)
 */

export function validateUITokens(): void {
  console.log('Validating UI design tokens...');

  try {
    // Use require to avoid React/JSX issues in Node.js
    const tokensModule = require('../tokens');
    const { tokens, spacing, typography, borderRadius } = tokensModule;

    // Test spacing tokens
    if (typeof spacing.xs !== 'number' || spacing.xs !== 4) {
      throw new Error('Spacing xs should be 4');
    }
    if (typeof spacing.xl !== 'number' || spacing.xl !== 20) {
      throw new Error('Spacing xl should be 20');
    }
    console.log('✓ Spacing tokens validation passed');

    // Test typography tokens
    if (typeof typography.sizes.lg !== 'number' || typography.sizes.lg !== 16) {
      throw new Error('Typography lg size should be 16');
    }
    if (typography.weights.bold !== '700') {
      throw new Error('Typography bold weight should be 700');
    }
    console.log('✓ Typography tokens validation passed');

    // Test border radius tokens
    if (typeof borderRadius.md !== 'number' || borderRadius.md !== 8) {
      throw new Error('Border radius md should be 8');
    }
    if (borderRadius.round !== 9999) {
      throw new Error('Border radius round should be 9999');
    }
    console.log('✓ Border radius tokens validation passed');

    // Test tokens export
    if (!tokens.spacing || !tokens.typography || !tokens.borderRadius) {
      throw new Error('Tokens export should include spacing, typography, and borderRadius');
    }
    console.log('✓ Tokens export validation passed');

  } catch (error) {
    throw new Error(`Tokens validation failed: ${error}`);
  }
}

export function validateUIStructure(): void {
  console.log('Validating UI structure...');

  try {
    // Just check if files exist without importing React components
    const fs = require('fs');
    const path = require('path');
    
    const uiDir = path.join(__dirname, '..');
    const tokensFile = path.join(uiDir, 'tokens.ts');
    const textComponent = path.join(uiDir, 'components', 'Text.tsx');
    const buttonComponent = path.join(uiDir, 'components', 'Button.tsx');
    const inputComponent = path.join(uiDir, 'components', 'Input.tsx');
    const cardComponent = path.join(uiDir, 'components', 'Card.tsx');

    if (!fs.existsSync(tokensFile)) {
      throw new Error('tokens.ts file should exist');
    }
    if (!fs.existsSync(textComponent)) {
      throw new Error('Text.tsx component should exist');
    }
    if (!fs.existsSync(buttonComponent)) {
      throw new Error('Button.tsx component should exist');
    }
    if (!fs.existsSync(inputComponent)) {
      throw new Error('Input.tsx component should exist');
    }
    if (!fs.existsSync(cardComponent)) {
      throw new Error('Card.tsx component should exist');
    }

    console.log('✓ UI structure validation passed');
  } catch (error) {
    throw new Error(`UI structure validation failed: ${error}`);
  }
}

// Run validation if this file is executed directly
if (require.main === module) {
  try {
    validateUITokens();
    validateUIStructure();
    console.log('All UI Kit validations passed! ✅');
  } catch (error) {
    console.error('UI Kit validation failed:', error);
    process.exit(1);
  }
}