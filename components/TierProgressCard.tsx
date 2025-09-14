/**
 * Budget Buddy Mobile - Tier Progress Card Component
 * @license MIT
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { formatCurrency } from '../utils/currencyUtils';

interface TierProgressCardProps {
  currentTier: {
    name: string;
    threshold: number;
    progress: number;
    nextTier?: { name: string; threshold: number };
  };
  onPress?: () => void;
  style?: any;
}

export default function TierProgressCard({ 
  currentTier, 
  onPress, 
  style 
}: TierProgressCardProps) {
  const getTierColor = (tierName: string) => {
    const colors: { [key: string]: string } = {
      'Starter': '#757575',
      'Bronze Saver': '#CD7F32',
      'Silver Saver': '#C0C0C0',
      'Gold Saver': '#FFD700',
      'Platinum Saver': '#E5E4E2',
      'Diamond Saver': '#B9F2FF',
      'Elite Saver': '#FF6B35',
    };
    return colors[tierName] || '#757575';
  };

  const getTierIcon = (tierName: string) => {
    const icons: { [key: string]: string } = {
      'Starter': '🌱',
      'Bronze Saver': '🥉',
      'Silver Saver': '🥈',
      'Gold Saver': '🥇',
      'Platinum Saver': '💎',
      'Diamond Saver': '💠',
      'Elite Saver': '👑',
    };
    return icons[tierName] || '🌱';
  };

  const getTierGradient = (tierName: string) => {
    const gradients: { [key: string]: string[] } = {
      'Starter': ['#757575', '#9E9E9E'],
      'Bronze Saver': ['#CD7F32', '#D2691E'],
      'Silver Saver': ['#C0C0C0', '#D3D3D3'],
      'Gold Saver': ['#FFD700', '#FFA500'],
      'Platinum Saver': ['#E5E4E2', '#F0F0F0'],
      'Diamond Saver': ['#B9F2FF', '#87CEEB'],
      'Elite Saver': ['#FF6B35', '#FF8C00'],
    };
    return gradients[tierName] || ['#757575', '#9E9E9E'];
  };

  const renderCard = () => {
    const content = (
      <>
        {/* Current Tier Header */}
        <View style={styles.tierHeader}>
          <Text style={styles.tierIcon}>{getTierIcon(currentTier.name)}</Text>
          <View style={styles.tierInfo}>
            <Text style={[styles.tierName, { color: getTierColor(currentTier.name) }]}>
              {currentTier.name}
            </Text>
            <Text style={styles.tierThreshold}>
              {formatCurrency(currentTier.threshold)}+ achieved
            </Text>
          </View>
          {currentTier.name === 'Elite Saver' && (
            <View style={styles.maxTierBadge}>
              <Text style={styles.maxTierText}>MAX</Text>
            </View>
          )}
        </View>

        {/* Progress Section */}
        {currentTier.nextTier ? (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>
                Progress to {currentTier.nextTier.name}
              </Text>
              <Text style={styles.progressPercent}>
                {Math.round(currentTier.progress)}%
              </Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${Math.min(100, Math.max(0, currentTier.progress))}%`,
                      backgroundColor: getTierColor(currentTier.nextTier.name)
                    }
                  ]} 
                />
              </View>
              <Text style={styles.nextTierIcon}>
                {getTierIcon(currentTier.nextTier.name)}
              </Text>
            </View>

            <View style={styles.progressFooter}>
              <Text style={styles.progressTarget}>
                Target: {formatCurrency(currentTier.nextTier.threshold)}
              </Text>
              <Text style={styles.progressRemaining}>
                {formatCurrency(currentTier.nextTier.threshold - currentTier.threshold)} to go
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.maxTierSection}>
            <Text style={styles.maxTierMessage}>🎉 Congratulations!</Text>
            <Text style={styles.maxTierSubtext}>
              You've reached the highest tier! Keep saving to maintain your elite status.
            </Text>
          </View>
        )}

        {/* Tier Benefits Preview */}
        <View style={styles.benefitsSection}>
          <Text style={styles.benefitsTitle}>Current Benefits:</Text>
          <View style={styles.benefitsList}>
            <Text style={styles.benefitItem}>✨ {currentTier.name} theme unlocked</Text>
            {currentTier.name !== 'Starter' && (
              <Text style={styles.benefitItem}>🏆 Special achievement badge</Text>
            )}
            {currentTier.nextTier && (
              <Text style={[styles.benefitItem, styles.benefitItemNext]}>
                🔒 Next: {currentTier.nextTier.name} theme
              </Text>
            )}
          </View>
        </View>
      </>
    );

    if (onPress) {
      return (
        <TouchableOpacity 
          style={[styles.container, style]} 
          onPress={onPress}
          activeOpacity={0.8}
        >
          {content}
        </TouchableOpacity>
      );
    }

    return (
      <View style={[styles.container, style]}>
        {content}
      </View>
    );
  };

  return renderCard();
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  tierIcon: {
    fontSize: 48,
    marginRight: 16,
  },
  tierInfo: {
    flex: 1,
  },
  tierName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tierThreshold: {
    fontSize: 14,
    color: '#666',
  },
  maxTierBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  maxTierText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressSection: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
    minWidth: 4,
  },
  nextTierIcon: {
    fontSize: 24,
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTarget: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  progressRemaining: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  maxTierSection: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  maxTierMessage: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  maxTierSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  benefitsSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  benefitsList: {
    gap: 8,
  },
  benefitItem: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  benefitItemNext: {
    color: '#999',
    fontStyle: 'italic',
  },
});
