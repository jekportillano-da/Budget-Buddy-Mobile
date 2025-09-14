/**
 * Phase 2 Test Runner - Execute comprehensive testing
 * Run this to validate Phase 2 implementation
 */
import { phase2Tests } from './phase2TestSuite';

async function runPhase2Tests() {
  console.log('🚀 Budget Buddy Phase 2 - Comprehensive Test Suite');
  console.log('================================================');
  
  try {
    const success = await phase2Tests.runAllTests();
    
    if (success) {
      console.log('\n📊 Running additional statistics test...');
      await phase2Tests.testStats();
      
      console.log('\n🎉 ALL TESTS PASSED! Phase 2 implementation is working correctly.');
      console.log('\n✅ Ready for production deployment!');
    } else {
      console.log('\n❌ Some tests failed. Please check the implementation.');
    }
  } catch (error) {
    console.error('\n💥 Test suite failed to run:', error);
  } finally {
    await phase2Tests.cleanup();
  }
}

// Export for use in app
export { runPhase2Tests };
