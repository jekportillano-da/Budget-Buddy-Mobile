/**
 * Budget Buddy Mobile - Achievement Notification Components
 * @license MIT
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import type { UserAchievement } from '../services/databaseService';
import { formatCurrency } from '../utils/currencyUtils';

const { width: screenWidth } = Dimensions.get('window');

interface AchievementModalProps {
  visible: boolean;
  achievements: UserAchievement[];
  onClose: () => void;
}

interface AchievementToastProps {
  achievement: UserAchievement;
  visible: boolean;
  onHide: () => void;
  duration?: number;
}

export function AchievementModal({ visible, achievements, onClose }: AchievementModalProps) {
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      slideAnim.setValue(0);
    }
  }, [visible]);

  const getAchievementIcon = (achievement: UserAchievement) => {
    if (achievement.achievement_type === 'tier') {
      const tierIcons: { [key: string]: string } = {
        'Bronze Saver': '🥉',
        'Silver Saver': '🥈',
        'Gold Saver': '🥇',
        'Platinum Saver': '💎',
        'Diamond Saver': '💠',
        'Elite Saver': '👑',
      };
      return tierIcons[achievement.achievement_name] || '🎖️';
    }
    return '⭐';
  };

  const getAchievementColor = (achievement: UserAchievement) => {
    if (achievement.achievement_type === 'tier') {
      const tierColors: { [key: string]: string } = {
        'Bronze Saver': '#CD7F32',
        'Silver Saver': '#C0C0C0',
        'Gold Saver': '#FFD700',
        'Platinum Saver': '#E5E4E2',
        'Diamond Saver': '#B9F2FF',
        'Elite Saver': '#FF6B35',
      };
      return tierColors[achievement.achievement_name] || '#4CAF50';
    }
    return '#4CAF50';
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View 
          style={[
            styles.modalContent,
            {
              transform: [
                {
                  scale: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
              opacity: slideAnim,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>🎉 Achievement Unlocked!</Text>
            <Text style={styles.modalSubtitle}>
              Congratulations on your progress!
            </Text>
          </View>

          {/* Achievements List */}
          <View style={styles.achievementsList}>
            {achievements.map((achievement, index) => (
              <View key={achievement.id || index} style={styles.achievementItem}>
                <View style={[
                  styles.achievementIconContainer,
                  { backgroundColor: getAchievementColor(achievement) + '20' }
                ]}>
                  <Text style={styles.achievementIcon}>
                    {getAchievementIcon(achievement)}
                  </Text>
                </View>
                <View style={styles.achievementDetails}>
                  <Text style={styles.achievementName}>
                    {achievement.achievement_name}
                  </Text>
                  <Text style={styles.achievementType}>
                    {achievement.achievement_type === 'tier' ? 'New Tier Reached' : 'Milestone Achieved'}
                  </Text>
                  <Text style={styles.achievementAmount}>
                    Earned at {formatCurrency(achievement.total_savings_at_achievement)}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Rewards Info */}
          {achievements.some(a => a.achievement_type === 'tier') && (
            <View style={styles.rewardsSection}>
              <Text style={styles.rewardsTitle}>🎁 New Rewards Unlocked:</Text>
              {achievements
                .filter(a => a.achievement_type === 'tier')
                .map((achievement, index) => (
                  <Text key={index} style={styles.rewardItem}>
                    ✨ {achievement.achievement_name} theme
                  </Text>
                ))}
            </View>
          )}

          {/* Action Button */}
          <TouchableOpacity style={styles.modalButton} onPress={onClose}>
            <Text style={styles.modalButtonText}>Awesome!</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

export function AchievementToast({ 
  achievement, 
  visible, 
  onHide, 
  duration = 4000 
}: AchievementToastProps) {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide in from top
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  if (!visible) return null;

  const getAchievementIcon = () => {
    if (achievement.achievement_type === 'tier') {
      const tierIcons: { [key: string]: string } = {
        'Bronze Saver': '🥉',
        'Silver Saver': '🥈',
        'Gold Saver': '🥇',
        'Platinum Saver': '💎',
        'Diamond Saver': '💠',
        'Elite Saver': '👑',
      };
      return tierIcons[achievement.achievement_name] || '🎖️';
    }
    return '⭐';
  };

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim,
        },
      ]}
    >
      <TouchableOpacity 
        style={styles.toastContent} 
        onPress={hideToast}
        activeOpacity={0.9}
      >
        <View style={styles.toastIcon}>
          <Text style={styles.toastIconText}>{getAchievementIcon()}</Text>
        </View>
        <View style={styles.toastDetails}>
          <Text style={styles.toastTitle}>Achievement Unlocked!</Text>
          <Text style={styles.toastName}>{achievement.achievement_name}</Text>
        </View>
        <TouchableOpacity style={styles.toastClose} onPress={hideToast}>
          <Text style={styles.toastCloseText}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Usage example component that manages multiple achievements
export function AchievementManager({ 
  achievements, 
  onClearAchievements 
}: { 
  achievements: UserAchievement[]; 
  onClearAchievements: () => void; 
}) {
  const [modalVisible, setModalVisible] = React.useState(false);
  const [currentToast, setCurrentToast] = React.useState<UserAchievement | null>(null);
  const [toastVisible, setToastVisible] = React.useState(false);
  const toastQueue = useRef<UserAchievement[]>([]);

  useEffect(() => {
    if (achievements.length > 0) {
      if (achievements.length === 1) {
        // Show toast for single achievement
        showToast(achievements[0]);
      } else {
        // Show modal for multiple achievements
        setModalVisible(true);
      }
    }
  }, [achievements]);

  const showToast = (achievement: UserAchievement) => {
    if (toastVisible) {
      // Queue the toast if one is already showing
      toastQueue.current.push(achievement);
      return;
    }

    setCurrentToast(achievement);
    setToastVisible(true);
  };

  const hideToast = () => {
    setToastVisible(false);
    setCurrentToast(null);

    // Show next toast in queue
    if (toastQueue.current.length > 0) {
      const nextToast = toastQueue.current.shift();
      if (nextToast) {
        setTimeout(() => showToast(nextToast), 500);
      }
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    onClearAchievements();
  };

  return (
    <>
      <AchievementModal
        visible={modalVisible}
        achievements={achievements}
        onClose={closeModal}
      />
      {currentToast && (
        <AchievementToast
          achievement={currentToast}
          visible={toastVisible}
          onHide={hideToast}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  achievementsList: {
    marginBottom: 20,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  achievementIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  achievementIcon: {
    fontSize: 32,
  },
  achievementDetails: {
    flex: 1,
  },
  achievementName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  achievementType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  achievementAmount: {
    fontSize: 12,
    color: '#999',
  },
  rewardsSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  rewardsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  rewardItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  modalButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Toast Styles
  toastContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  toastContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  toastIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  toastIconText: {
    fontSize: 20,
  },
  toastDetails: {
    flex: 1,
  },
  toastTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 2,
  },
  toastName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  toastClose: {
    padding: 8,
  },
  toastCloseText: {
    fontSize: 16,
    color: '#999',
    fontWeight: 'bold',
  },
});
