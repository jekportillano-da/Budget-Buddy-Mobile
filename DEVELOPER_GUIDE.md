# Developer Quick Start Guide

## New Architecture Systems - Quick Reference

### 🔗 API Clients (Typed & Safe)
```typescript
// HTTP Client with automatic error handling
import { httpClient } from '@/shared/api';

const user = await httpClient.get<UserProfile>('/user/profile');
const result = await httpClient.post<LoginResponse>('/auth/login', credentials);
```

### 🎯 Tier Logic (No More Magic Strings)
```typescript
import { canUseAI, getTierLevel, TIER_LEVELS } from '@/shared/entities/tier';

// Instead of: user.tier === 'Gold Saver'
if (canUseAI(user.tier)) {
  // Show AI features
}

// Instead of: user.tier === 'Bronze Saver' || user.tier === 'Silver Saver'
if (getTierLevel(user.tier) >= TIER_LEVELS.SILVER) {
  // Show premium features
}
```

### 🔄 React Query (Server State)
```typescript
import { useBusinessIntelligence, useUsageStats } from '@/shared/hooks';

// Auto-refreshing insights with cache
const { data: insights, isLoading, refetch } = useBusinessIntelligence({
  bills, currentBudget, profile, totalHouseholdIncome
});

// Usage statistics with background refresh
const { data: usage } = useUsageStats({ userId });
```

### 🎨 UI Kit (Design System)
```typescript
import { Text as UIText, Button as UIButton, Input as UIInput } from '@/shared/ui';

<UIText variant="h2" color="primary" weight="bold">
  Title
</UIText>

<UIButton variant="primary" onPress={handlePress}>
  Action
</UIButton>

<UIInput 
  placeholder="Enter amount"
  value={amount}
  onChangeText={setAmount}
/>
```

### 📊 Error Handling (Comprehensive)
```typescript
import { AppError, ErrorMappers, logger } from '@/shared/lib';

try {
  await riskyOperation();
} catch (error) {
  const appError = ErrorMappers.fromJavaScriptError(error);
  logger.error('Operation failed', appError);
  
  // Show user-friendly message
  Alert.alert('Error', appError.userMessage);
}
```

### 🛡️ Auth Feature Island
```typescript
import { LoginUseCase } from '@/features/auth';

const loginUseCase = new LoginUseCase();

const result = await loginUseCase.execute(email, password, {
  onProgress: (step) => setStatus(step),
  timeout: 30000
});
```

## Migration Tips

### ✅ Safe to Use Immediately
- UI Kit components (gradual replacement)
- Error handling system (enhanced debugging)
- Tier logic helpers (replace magic strings)
- React Query hooks (better data fetching)

### 🔄 Gradual Adoption
- Start with new features using new patterns
- Migrate existing components one at a time
- Use new API clients for new endpoints
- Apply error handling to high-traffic areas

### 📝 Best Practices
- Always use typed clients for new API calls
- Prefer UI Kit components for consistent styling
- Use AppError system for better error handling
- Implement React Query for server state management

---

Happy coding! 🚀