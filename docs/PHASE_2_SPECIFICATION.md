# Phase 2: Gamified Savings System - Technical Specification

## 🎯 System Goal
Enhance user engagement through gamified savings tracking without breaking existing functionality.

---

## 🧱 Database Schema Extensions

### New SQLite Tables (Non-Breaking)

```sql
-- Savings entries table
CREATE TABLE IF NOT EXISTS savings_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  amount REAL NOT NULL,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('daily', 'weekly', 'monthly', 'other')),
  label TEXT,
  purpose TEXT,
  date_entered DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  synced BOOLEAN DEFAULT FALSE
);

-- User tiers and achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  achievement_type TEXT NOT NULL, -- 'tier', 'badge', 'milestone'
  achievement_name TEXT NOT NULL, -- 'bronze', 'silver', 'first_save', etc.
  achieved_at DATETIME NOT NULL,
  total_savings_at_achievement REAL NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Theme and visual preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  preference_type TEXT NOT NULL, -- 'theme', 'avatar_border', 'badge_display'
  preference_key TEXT NOT NULL,
  preference_value TEXT NOT NULL,
  unlocked_at DATETIME,
  is_active BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Savings goals (future-ready)
CREATE TABLE IF NOT EXISTS savings_goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  goal_name TEXT NOT NULL,
  target_amount REAL NOT NULL,
  current_amount REAL DEFAULT 0,
  target_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🏗 Component Architecture

### New Files Structure (Additive Only)

```
app/
  (tabs)/
    ledger.tsx                 # New Ledger tab screen
    
components/
  savings/                     # New savings components
    SavingsEntryForm.tsx
    SavingsBreakdown.tsx
    TierDisplay.tsx
    ProgressMeter.tsx
  theme/                       # Theme system components
    ThemeProvider.tsx
    ThemeSelector.tsx
  gamification/               # Gamification components
    AchievementBadge.tsx
    TierUnlockModal.tsx
    RewardsPanel.tsx

stores/
  savingsStore.ts             # New savings state management
  tierStore.ts                # Tier and achievement logic
  themeStore.ts               # Theme and visual preferences

services/
  savingsService.ts           # Savings business logic
  tierService.ts              # Tier calculation and rewards
  themeService.ts             # Theme management
```

---

## 🎮 Gamification System Design

### Tier Structure
```typescript
export const TIER_THRESHOLDS = {
  bronze: 1000,    // ₱1,000
  silver: 5000,    // ₱5,000
  gold: 10000,     // ₱10,000
  platinum: 25000  // ₱25,000
} as const;

export const TIER_REWARDS = {
  bronze: {
    themes: ['retro'],
    badges: ['first_saver'],
    avatarBorders: ['bronze_ring']
  },
  silver: {
    themes: ['retro', 'neon'],
    badges: ['first_saver', 'consistent_saver'],
    avatarBorders: ['bronze_ring', 'silver_glow']
  },
  gold: {
    themes: ['retro', 'neon', 'grayscale'],
    badges: ['first_saver', 'consistent_saver', 'goal_crusher'],
    avatarBorders: ['bronze_ring', 'silver_glow', 'gold_crown']
  },
  platinum: {
    themes: ['retro', 'neon', 'grayscale', 'premium'],
    badges: ['first_saver', 'consistent_saver', 'goal_crusher', 'savings_master'],
    avatarBorders: ['bronze_ring', 'silver_glow', 'gold_crown', 'platinum_aura']
  }
} as const;
```

---

## 🎨 Theme System Architecture

### Theme Context (Non-Breaking)
```typescript
export interface Theme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    accent: string;
  };
  unlockRequirement: 'bronze' | 'silver' | 'gold' | 'platinum' | null;
}

export const AVAILABLE_THEMES: Theme[] = [
  {
    id: 'default',
    name: 'Default',
    colors: {
      primary: '#2196F3',
      secondary: '#03DAC6',
      background: '#FFFFFF',
      surface: '#F5F5F5',
      text: '#000000',
      accent: '#FF9800'
    },
    unlockRequirement: null
  },
  {
    id: 'retro',
    name: 'Retro Wave',
    colors: {
      primary: '#FF6B9D',
      secondary: '#C44569',
      background: '#2C1810',
      surface: '#40407A',
      text: '#F8F9FA',
      accent: '#FFD93D'
    },
    unlockRequirement: 'bronze'
  }
  // Additional themes...
];
```

---

## 🔌 Integration Points

### 1. Tab Navigation Extension
```typescript
// Modify app/(tabs)/_layout.tsx - ADD ONLY
<Tabs.Screen
  name="ledger"
  options={{
    title: 'Ledger',
    tabBarIcon: ({ color, focused }) => (
      <TabIcon name={focused ? 'wallet' : 'wallet-outline'} color={color} />
    ),
  }}
/>
```

### 2. Profile Screen Enhancement
```typescript
// Add to existing Profile screen - NON-BREAKING
import { TierDisplay } from '../../components/savings/TierDisplay';
import { AchievementBadge } from '../../components/gamification/AchievementBadge';

// Wrap existing profile content
<ThemeProvider>
  {/* Existing profile content */}
  <TierDisplay />
  <AchievementBadge />
</ThemeProvider>
```

### 3. Database Service Extension
```typescript
// Add to existing databaseService.ts
class DatabaseService {
  // ... existing methods ...
  
  // NEW METHODS - NON-BREAKING
  async saveSavingsEntry(entry: SavingsEntry): Promise<number> { /* ... */ }
  async getSavingsEntries(limit?: number): Promise<SavingsEntry[]> { /* ... */ }
  async getTotalSavings(): Promise<number> { /* ... */ }
  async saveAchievement(achievement: Achievement): Promise<void> { /* ... */ }
  async getUserTier(): Promise<string> { /* ... */ }
}
```

---

## 📊 Data Flow Design

### Savings Entry Flow
```
User Input → SavingsEntryForm → savingsStore.addEntry() → 
savingsService.processEntry() → databaseService.saveSavingsEntry() → 
tierStore.checkTierUpgrade() → UI Update + Reward Modal
```

### Tier Calculation Flow
```
New Savings Entry → Calculate Total → Check Thresholds → 
Update User Tier → Unlock New Rewards → Save Achievement → 
Show Unlock Animation
```

### Theme Application Flow
```
Theme Selection → Validate Unlock Status → themeStore.setActiveTheme() → 
ThemeProvider Context Update → UI Re-render with New Colors
```

---

## 🚀 Implementation Phases

### Phase 2A: Core Ledger (Week 1)
- [ ] Create savings database tables
- [ ] Build Ledger tab with entry form
- [ ] Implement basic savings tracking
- [ ] Add savings breakdown visualization

### Phase 2B: Tier System (Week 2)  
- [ ] Implement tier calculation logic
- [ ] Create tier display components
- [ ] Add achievement system
- [ ] Build tier upgrade notifications

### Phase 2C: Theme System (Week 3)
- [ ] Create theme provider and context
- [ ] Build theme selector component
- [ ] Implement theme unlocking logic
- [ ] Add theme preview functionality

### Phase 2D: Integration & Polish (Week 4)
- [ ] Integrate with existing Profile screen
- [ ] Add achievement badges
- [ ] Implement reward unlock animations
- [ ] Test and optimize performance

---

## 🔮 Future-Ready Considerations

### Cloud Sync Preparation
- All new tables include `synced` boolean field
- Savings entries have UUID potential for conflict resolution
- Achievement timestamps for sync ordering

### AI Integration Points
- Savings patterns analysis endpoints ready
- Tier-based personalized recommendations structure
- Goal achievement prediction data collection

### Export Capabilities
- Savings data structured for CSV/JSON export
- Achievement history for portfolio building
- Spending vs. Savings correlation analysis

---

## ⚠️ Risk Mitigation

### Backward Compatibility
- Zero modifications to existing database tables
- All new components isolated in separate directories
- Existing screens unchanged except for additive enhancements

### Performance Considerations
- Lazy loading for achievement animations
- Optimized SQLite queries with proper indexing
- Theme switching without component remounts

### Error Handling
- Graceful degradation if new features fail
- Existing app functionality remains intact
- Comprehensive error logging for debugging

---

*This specification ensures Phase 2 enhances user engagement while maintaining the stable foundation built in Phase 1.*
