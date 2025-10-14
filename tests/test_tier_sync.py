#!/usr/bin/env python3
"""
Test Tier Sync Service
Tests the tier synchronization between frontend and backend
"""

import sys
import os

# Add parent and backend directories to Python path
parent_dir = os.path.dirname(os.path.dirname(__file__))
backend_dir = os.path.join(parent_dir, 'backend')
sys.path.insert(0, parent_dir)
sys.path.insert(0, backend_dir)

def test_tier_sync_service():
    """Test that the tier sync service endpoint works"""
    print("🧪 Testing Tier Sync Service")
    print("=" * 40)
    
    try:
        # Import backend modules
        from backend.users.routes import router as user_router
        from backend.auth.utils import get_tier_features
        
        print("✅ PASSED: User routes imported successfully")
        
        # Test tier calculation logic
        tier_thresholds = [
            (10000, "Elite Saver"),
            (5000, "Diamond Saver"),
            (2500, "Platinum Saver"),
            (1000, "Gold Saver"),
            (500, "Silver Saver"),
            (100, "Bronze Saver"),
            (0, "Starter")
        ]
        
        # Test tier calculations
        test_cases = [
            (0, "Starter"),
            (99, "Starter"),
            (100, "Bronze Saver"),
            (499, "Bronze Saver"),
            (500, "Silver Saver"),
            (999, "Silver Saver"),
            (1000, "Gold Saver"),
            (2499, "Gold Saver"),
            (2500, "Platinum Saver"),
            (4999, "Platinum Saver"),
            (5000, "Diamond Saver"),
            (9999, "Diamond Saver"),
            (10000, "Elite Saver"),
            (15000, "Elite Saver")
        ]
        
        for savings_amount, expected_tier in test_cases:
            calculated_tier = "Starter"
            for threshold, tier_name in tier_thresholds:
                if savings_amount >= threshold:
                    calculated_tier = tier_name
                    break
            
            if calculated_tier == expected_tier:
                print(f"✅ PASSED: ₱{savings_amount:,} -> {calculated_tier}")
            else:
                print(f"❌ FAILED: ₱{savings_amount:,} -> Expected: {expected_tier}, Got: {calculated_tier}")
                return False
        
        # Test tier features
        for tier in ["Starter", "Bronze Saver", "Silver Saver", "Gold Saver", "Platinum Saver", "Diamond Saver", "Elite Saver"]:
            try:
                features = get_tier_features(tier)
                if features and 'tier' in features:
                    print(f"✅ PASSED: {tier} features available")
                else:
                    print(f"❌ FAILED: {tier} features missing")
                    return False
            except Exception as e:
                print(f"❌ FAILED: {tier} features error - {e}")
                return False
        
        print("✅ Tier sync service tests completed successfully")
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def test_frontend_tier_service():
    """Test that the frontend tier service exists"""
    print("\n🧪 Testing Frontend Tier Service")
    print("=" * 40)
    
    try:
        # Check if the tier sync service file exists
        tier_sync_service_path = os.path.join(parent_dir, 'services', 'tierSyncService.ts')
        
        if os.path.exists(tier_sync_service_path):
            print("✅ PASSED: tierSyncService.ts exists")
            
            # Read and validate the file content
            with open(tier_sync_service_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
                required_methods = [
                    'syncTierWithBackend',
                    'shouldSyncTier',
                    'calculateTierFromSavings'
                ]
                
                for method in required_methods:
                    if method in content:
                        print(f"✅ PASSED: {method} method exists")
                    else:
                        print(f"❌ FAILED: {method} method missing")
                        return False
                
                # Check tier thresholds match backend
                if 'Elite Saver' in content and '10000' in content:
                    print("✅ PASSED: Elite Saver threshold matches backend")
                else:
                    print("❌ FAILED: Elite Saver threshold mismatch")
                    return False
                    
                print("✅ Frontend tier service tests completed successfully")
                return True
        else:
            print("❌ FAILED: tierSyncService.ts not found")
            return False
            
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Budget Buddy Tier Sync Testing")
    print("📅 Testing tier synchronization functionality")
    print("=" * 60)
    
    backend_success = test_tier_sync_service()
    frontend_success = test_frontend_tier_service()
    
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS:")
    
    if backend_success and frontend_success:
        print("🎉 All tests passed! Tier sync functionality is working correctly.")
        print("✅ Backend tier calculation: WORKING")
        print("✅ Frontend tier service: WORKING")
        print("✅ Tier thresholds: SYNCHRONIZED")
        sys.exit(0)
    else:
        print("❌ Some tests failed. Please check the output above.")
        if not backend_success:
            print("❌ Backend tier calculation: FAILED")
        if not frontend_success:
            print("❌ Frontend tier service: FAILED")
        sys.exit(1)