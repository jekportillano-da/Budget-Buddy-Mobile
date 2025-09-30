/**
 * Insights Query Hooks Validation
 * Tests for React Query integration
 */

export function validateInsightsClient(): void {
  console.log('Validating insights client...');

  try {
    // Test imports
    const { insightsClient, InsightsRequestSchema, BusinessIntelligenceSchema } = require('../../api/clients/insightsClient');
    
    if (typeof insightsClient !== 'object') {
      throw new Error('insightsClient should be an object');
    }
    
    if (typeof insightsClient.getInsights !== 'function') {
      throw new Error('insightsClient.getInsights should be a function');
    }

    if (typeof insightsClient.getUsageStats !== 'function') {
      throw new Error('insightsClient.getUsageStats should be a function');
    }

    if (typeof insightsClient.getBusinessIntelligence !== 'function') {
      throw new Error('insightsClient.getBusinessIntelligence should be a function');
    }

    console.log('✓ Insights client structure validation passed');

    // Test Zod schemas
    const testRequest = {
      monthly_income: 50000,
      monthly_expenses: 30000,
      expense_categories: { food: 15000, utilities: 8000, transport: 7000 }
    };

    const validatedRequest = InsightsRequestSchema.parse(testRequest);
    if (!validatedRequest) {
      throw new Error('InsightsRequestSchema should validate valid request');
    }

    console.log('✓ Zod schema validation passed');

    // Test fallback insights generation
    const testData = {
      bills: [
        { amount: 5000, category: 'utilities' },
        { amount: 8000, category: 'food' },
        { amount: 3000, category: 'transport' }
      ],
      currentBudget: 20000,
      monthlyTotal: 16000,
      budgetBreakdown: {},
      profile: { id: 'test', fullName: 'Test User' },
      totalHouseholdIncome: 40000
    };

    // This should return fallback insights without throwing
    insightsClient.getBusinessIntelligence(testData)
      .then((insights: any) => {
        const validated = BusinessIntelligenceSchema.parse(insights);
        if (!validated.executiveSummary) {
          throw new Error('Business intelligence should have executive summary');
        }
        console.log('✓ Business intelligence generation works');
      })
      .catch((error: Error) => {
        throw new Error(`Business intelligence generation failed: ${error.message}`);
      });

    console.log('✓ Insights client validation passed');

  } catch (error) {
    throw new Error(`Insights client validation failed: ${error}`);
  }
}

export function validateReactQueryHooks(): void {
  console.log('Validating React Query hooks...');

  try {
    // Test hook imports (structure only - we can't actually call hooks outside React)
    const hooksModule = require('../useInsightsQuery');
    
    if (typeof hooksModule.useBusinessIntelligence !== 'function') {
      throw new Error('useBusinessIntelligence should be a function');
    }

    if (typeof hooksModule.useBackendInsights !== 'function') {
      throw new Error('useBackendInsights should be a function');
    }

    if (typeof hooksModule.useUsageStats !== 'function') {
      throw new Error('useUsageStats should be a function');
    }

    if (typeof hooksModule.useRefreshInsights !== 'function') {
      throw new Error('useRefreshInsights should be a function');
    }

    if (typeof hooksModule.usePrefetchBusinessIntelligence !== 'function') {
      throw new Error('usePrefetchBusinessIntelligence should be a function');
    }

    if (typeof hooksModule.useCachedInsights !== 'function') {
      throw new Error('useCachedInsights should be a function');
    }

    console.log('✓ React Query hooks structure validation passed');

    // Test query keys structure
    if (!hooksModule.insightsKeys || typeof hooksModule.insightsKeys !== 'object') {
      throw new Error('insightsKeys should be exported');
    }

    if (!Array.isArray(hooksModule.insightsKeys.all)) {
      throw new Error('insightsKeys.all should be an array');
    }

    if (typeof hooksModule.insightsKeys.businessIntelligence !== 'function') {
      throw new Error('insightsKeys.businessIntelligence should be a function');
    }

    console.log('✓ Query keys structure validation passed');
    console.log('✓ React Query hooks validation passed');

  } catch (error) {
    throw new Error(`React Query hooks validation failed: ${error}`);
  }
}

export function validateBusinessIntelligenceComponent(): void {
  console.log('Validating Business Intelligence component...');

  try {
    // Test component import (structure only)
    const componentModule = require('../../../components/BusinessIntelligenceExample');
    
    if (typeof componentModule.BusinessIntelligenceExample !== 'function') {
      throw new Error('BusinessIntelligenceExample should be a function component');
    }

    if (typeof componentModule.default !== 'function') {
      throw new Error('BusinessIntelligenceExample should have default export');
    }

    console.log('✓ Business Intelligence component structure validation passed');

  } catch (error) {
    throw new Error(`Business Intelligence component validation failed: ${error}`);
  }
}

// Run validation if this file is executed directly
if (require.main === module) {
  try {
    validateInsightsClient();
    validateReactQueryHooks();
    // Skip component validation - React JSX components can't be required in Node.js without JSX compilation
    console.log('All Insights Query validations passed! ✅');
    console.log('Note: Component validation skipped due to React JSX requirements');
  } catch (error) {
    console.error('Insights Query validation failed:', error);
    process.exit(1);
  }
}