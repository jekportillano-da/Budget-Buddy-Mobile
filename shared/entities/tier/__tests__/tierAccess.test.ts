/**
 * Tier Access Logic Validation
 * Basic validation for tier access functions
 */

import {
  canUseAI,
  hasPremiumInsights,
  hasUnlimitedAI,
  getTierLevel,
  getTierThreshold,
  limitsFor,
  getTierFeatureText,
  getSavingsNeededForNextTier,
  getAllTiers,
  getTierEmoji,
} from '../tierAccess';

export function validateTierAccess(): void {
  console.log('Validating tier access logic...');

  // Test tier levels
  if (getTierLevel('Starter') !== 0) throw new Error('Starter tier level should be 0');
  if (getTierLevel('Bronze Saver') !== 1) throw new Error('Bronze Saver tier level should be 1');
  if (getTierLevel('Elite Saver') !== 6) throw new Error('Elite Saver tier level should be 6');
  console.log('✓ Tier levels validation passed');

  // Test tier thresholds
  if (getTierThreshold('Starter') !== 0) throw new Error('Starter threshold should be 0');
  if (getTierThreshold('Bronze Saver') !== 100) throw new Error('Bronze Saver threshold should be 100');
  if (getTierThreshold('Elite Saver') !== 10000) throw new Error('Elite Saver threshold should be 10000');
  console.log('✓ Tier thresholds validation passed');

  // Test AI access
  if (canUseAI('Starter') !== false) throw new Error('Starter should not have AI access');
  if (canUseAI('Bronze Saver') !== true) throw new Error('Bronze Saver should have AI access');
  if (canUseAI('Elite Saver') !== true) throw new Error('Elite Saver should have AI access');
  console.log('✓ AI access validation passed');

  // Test premium insights
  if (hasPremiumInsights('Bronze Saver') !== false) throw new Error('Bronze Saver should not have premium insights');
  if (hasPremiumInsights('Gold Saver') !== true) throw new Error('Gold Saver should have premium insights');
  console.log('✓ Premium insights validation passed');

  // Test unlimited AI
  if (hasUnlimitedAI('Gold Saver') !== false) throw new Error('Gold Saver should not have unlimited AI');
  if (hasUnlimitedAI('Platinum Saver') !== true) throw new Error('Platinum Saver should have unlimited AI');
  console.log('✓ Unlimited AI validation passed');

  // Test limits
  const starterLimits = limitsFor('Starter');
  if (starterLimits.aiChatEnabled !== false) throw new Error('Starter should not have AI chat enabled');
  if (starterLimits.aiRequestsPerDay !== 0) throw new Error('Starter should have 0 AI requests');

  const bronzeLimits = limitsFor('Bronze Saver');
  if (bronzeLimits.aiChatEnabled !== true) throw new Error('Bronze Saver should have AI chat enabled');
  if (bronzeLimits.aiRequestsPerDay !== 5) throw new Error('Bronze Saver should have 5 AI requests');

  const platinumLimits = limitsFor('Platinum Saver');
  if (platinumLimits.aiRequestsPerDay !== -1) throw new Error('Platinum Saver should have unlimited AI requests');
  console.log('✓ Tier limits validation passed');

  // Test savings needed calculation
  const savingsNeeded = getSavingsNeededForNextTier(50, 'Starter');
  if (savingsNeeded.nextTier !== 'Bronze Saver') throw new Error('Next tier should be Bronze Saver');
  if (savingsNeeded.amountNeeded !== 50) throw new Error('Should need 50 more for Bronze');

  const maxTierSavings = getSavingsNeededForNextTier(15000, 'Elite Saver');
  if (maxTierSavings.nextTier !== null) throw new Error('Elite should have no next tier');
  if (maxTierSavings.amountNeeded !== 0) throw new Error('Elite should need 0 more');
  console.log('✓ Savings needed calculation validation passed');

  // Test feature text
  const starterText = getTierFeatureText('Starter');
  if (!starterText.includes('🔒')) throw new Error('Starter text should include lock emoji');
  
  const platinumText = getTierFeatureText('Platinum Saver');
  if (!platinumText.includes('🌟')) throw new Error('Platinum text should include star emoji');
  console.log('✓ Feature text validation passed');

  // Test get all tiers
  const allTiers = getAllTiers();
  if (allTiers.length !== 7) throw new Error('Should have 7 tiers');
  if (allTiers[0].name !== 'Starter') throw new Error('First tier should be Starter');
  if (allTiers[6].name !== 'Elite Saver') throw new Error('Last tier should be Elite Saver');
  console.log('✓ Get all tiers validation passed');

  // Test tier emoji
  const starterEmoji = getTierEmoji('Starter');
  if (starterEmoji !== '🥉') throw new Error('Starter should have bronze medal emoji');
  
  const eliteEmoji = getTierEmoji('Elite Saver');
  if (eliteEmoji !== '👑') throw new Error('Elite Saver should have crown emoji');
  
  const unknownEmoji = getTierEmoji('Unknown Tier');
  if (unknownEmoji !== '🏆') throw new Error('Unknown tier should have trophy emoji');
  console.log('✓ Tier emoji validation passed');
}

// Run validation if this file is executed directly
if (require.main === module) {
  try {
    validateTierAccess();
    console.log('All tier access validations passed! ✅');
  } catch (error) {
    console.error('Tier access validation failed:', error);
    process.exit(1);
  }
}