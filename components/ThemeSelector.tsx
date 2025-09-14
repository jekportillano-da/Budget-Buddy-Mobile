/**
 * Budget Buddy Mobile - Theme Selector Component
 * @license MIT
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import type { UserPreference } from '../services/databaseService';

interface ThemeSelectorProps {
  unlockedThemes: UserPreference[];
  activeTheme: string;
  onThemeSelect: (themeKey: string) => Promise<boolean>;
  style?: any;
  showModal?: boolean;
  onCloseModal?: () => void;
}

interface ThemeCardProps {
  themeKey: string;
  isActive: boolean;
  isUnlocked: boolean;
  onSelect: () => void;
  unlockDate?: string;
}

function ThemeCard({ themeKey, isActive, isUnlocked, onSelect, unlockDate }: ThemeCardProps) {
  const getThemeData = (key: string) => {
    const themeData: { [key: string]: { name: string; colors: string[]; icon: string; tier?: string } } = {
      default: {
        name: 'Default',
        colors: ['#2196F3', '#1976D2'],
        icon: '🎨',
      },
      bronze_theme: {
        name: 'Bronze',
        colors: ['#CD7F32', '#D2691E'],
        icon: '🥉',
        tier: 'Bronze Saver',
      },
      silver_theme: {
        name: 'Silver',
        colors: ['#C0C0C0', '#A9A9A9'],
        icon: '🥈',
        tier: 'Silver Saver',
      },
      gold_theme: {
        name: 'Gold',
        colors: ['#FFD700', '#FFA500'],
        icon: '🥇',
        tier: 'Gold Saver',
      },
      platinum_theme: {
        name: 'Platinum',
        colors: ['#E5E4E2', '#D3D3D3'],
        icon: '💎',
        tier: 'Platinum Saver',
      },
      diamond_theme: {
        name: 'Diamond',
        colors: ['#B9F2FF', '#87CEEB'],
        icon: '💠',
        tier: 'Diamond Saver',
      },
      elite_theme: {
        name: 'Elite',
        colors: ['#FF6B35', '#FF8C00'],
        icon: '👑',
        tier: 'Elite Saver',
      },
    };
    return themeData[key] || themeData.default;
  };

  const theme = getThemeData(themeKey);

  return (
    <TouchableOpacity
      style={[
        styles.themeCard,
        isActive && styles.themeCardActive,
        !isUnlocked && styles.themeCardLocked,
      ]}
      onPress={isUnlocked ? onSelect : undefined}
      disabled={!isUnlocked}
    >
      {/* Theme Preview */}
      <View style={styles.themePreview}>
        <View
          style={[
            styles.themeColorPreview,
            {
              backgroundColor: theme.colors[0],
              borderColor: isActive ? '#333' : 'transparent',
              borderWidth: isActive ? 3 : 0,
            },
          ]}
        >
          <Text style={styles.themeIcon}>{theme.icon}</Text>
        </View>
      </View>

      {/* Theme Info */}
      <View style={styles.themeInfo}>
        <Text style={[styles.themeName, !isUnlocked && styles.themeNameLocked]}>
          {theme.name}
        </Text>
        {theme.tier && (
          <Text style={[styles.themeTier, !isUnlocked && styles.themeTierLocked]}>
            {theme.tier}
          </Text>
        )}
        {unlockDate && (
          <Text style={styles.themeUnlockDate}>
            Unlocked {new Date(unlockDate).toLocaleDateString()}
          </Text>
        )}
      </View>

      {/* Status Indicators */}
      <View style={styles.themeStatus}>
        {isActive && (
          <View style={styles.activeIndicator}>
            <Text style={styles.activeText}>✓</Text>
          </View>
        )}
        {!isUnlocked && (
          <View style={styles.lockedIndicator}>
            <Text style={styles.lockedText}>🔒</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function ThemeSelector({
  unlockedThemes,
  activeTheme,
  onThemeSelect,
  style,
  showModal = false,
  onCloseModal,
}: ThemeSelectorProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Always include default theme
  const allThemes = [
    'default',
    'bronze_theme',
    'silver_theme',
    'gold_theme',
    'platinum_theme',
    'diamond_theme',
    'elite_theme',
  ];

  const isThemeUnlocked = (themeKey: string) => {
    if (themeKey === 'default') return true;
    return unlockedThemes.some(theme => theme.preference_key === themeKey);
  };

  const getThemeUnlockDate = (themeKey: string) => {
    const theme = unlockedThemes.find(t => t.preference_key === themeKey);
    return theme?.unlocked_at;
  };

  const handleThemeSelect = async (themeKey: string) => {
    if (isLoading || themeKey === activeTheme) return;

    setIsLoading(true);
    try {
      const success = await onThemeSelect(themeKey);
      if (!success) {
        Alert.alert('Error', 'Failed to activate theme');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const renderThemeGrid = () => (
    <View style={styles.themeGrid}>
      {allThemes.map((themeKey) => (
        <ThemeCard
          key={themeKey}
          themeKey={themeKey}
          isActive={themeKey === activeTheme}
          isUnlocked={isThemeUnlocked(themeKey)}
          onSelect={() => handleThemeSelect(themeKey)}
          unlockDate={getThemeUnlockDate(themeKey)}
        />
      ))}
    </View>
  );

  const renderContent = () => (
    <View style={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Theme Selection</Text>
        <Text style={styles.subtitle}>
          Unlock new themes by reaching higher savings tiers
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {renderThemeGrid()}
      </ScrollView>

      {/* Stats */}
      <View style={styles.stats}>
        <Text style={styles.statsText}>
          {unlockedThemes.length + 1} of {allThemes.length} themes unlocked
        </Text>
      </View>
    </View>
  );

  if (showModal) {
    return (
      <Modal
        visible={showModal}
        animationType="slide"
        onRequestClose={onCloseModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose Theme</Text>
            <TouchableOpacity onPress={onCloseModal}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          {renderContent()}
        </View>
      </Modal>
    );
  }

  return <View style={[styles.container, style]}>{renderContent()}</View>;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  themeCard: {
    width: '47%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 16,
  },
  themeCardActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#f1f8e9',
  },
  themeCardLocked: {
    opacity: 0.6,
  },
  themePreview: {
    marginBottom: 12,
  },
  themeColorPreview: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  themeIcon: {
    fontSize: 28,
  },
  themeInfo: {
    alignItems: 'center',
    marginBottom: 8,
  },
  themeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  themeNameLocked: {
    color: '#999',
  },
  themeTier: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  themeTierLocked: {
    color: '#999',
  },
  themeUnlockDate: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  themeStatus: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  activeIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  lockedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedText: {
    fontSize: 12,
  },
  stats: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalClose: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
  },
});
