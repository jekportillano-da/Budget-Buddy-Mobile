import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  Text,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface SavingsCelebrationProps {
  amount: number;
  isVisible: boolean;
  onComplete?: () => void;
}

const { width, height } = Dimensions.get('window');

export default function SavingsCelebration({
  amount,
  isVisible,
  onComplete,
}: SavingsCelebrationProps) {
  const theme = useTheme();
  const dollarSignAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const confettiAnims = useRef(
    Array.from({ length: 15 }, () => ({
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
      rotate: new Animated.Value(0),
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isVisible) {
      startCelebration();
    }
  }, [isVisible]);

  const startCelebration = () => {
    // Reset all animations
    dollarSignAnim.setValue(0);
    scaleAnim.setValue(0);
    opacityAnim.setValue(0);
    rotateAnim.setValue(0);
    confettiAnims.forEach(confetti => {
      confetti.translateX.setValue(0);
      confetti.translateY.setValue(0);
      confetti.rotate.setValue(0);
      confetti.scale.setValue(0);
      confetti.opacity.setValue(0);
    });

    // Main dollar sign animation
    const mainAnimation = Animated.sequence([
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.5,
          duration: 500,
          easing: Easing.out(Easing.back(2)),
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.back(1)),
        useNativeDriver: true,
      }),
      Animated.delay(500),
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]);

    // Confetti animation
    const confettiAnimation = Animated.stagger(
      50,
      confettiAnims.map((confetti, index) => {
        const angle = (index / confettiAnims.length) * 2 * Math.PI;
        const distance = 150 + Math.random() * 100;
        const endX = Math.cos(angle) * distance;
        const endY = Math.sin(angle) * distance - 100;

        return Animated.sequence([
          Animated.delay(300), // Wait for dollar sign to appear
          Animated.parallel([
            Animated.timing(confetti.opacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(confetti.scale, {
              toValue: 1,
              duration: 200,
              easing: Easing.out(Easing.back(2)),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(confetti.translateX, {
              toValue: endX,
              duration: 1000,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(confetti.translateY, {
              toValue: endY,
              duration: 1000,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(confetti.rotate, {
              toValue: 360,
              duration: 1000,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.delay(500),
              Animated.timing(confetti.opacity, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
              }),
            ]),
          ]),
        ]);
      })
    );

    // Pulsing background animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    // Start animations
    pulseAnimation.start();
    Animated.parallel([mainAnimation, confettiAnimation]).start(() => {
      pulseAnimation.stop();
      pulseAnim.setValue(1);
      if (onComplete) {
        onComplete();
      }
    });
  };

  if (!isVisible) return null;

  const rotateInterpolation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const confettiColors = [
    theme.currentTheme.colors.primary,
    theme.currentTheme.colors.secondary,
    theme.currentTheme.colors.accent,
    theme.currentTheme.colors.success,
    '#FFD700', // Gold
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
  ];

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Pulsing background */}
      <Animated.View
        style={[
          styles.background,
          {
            backgroundColor: theme.currentTheme.colors.primary,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />

      {/* Main dollar sign */}
      <Animated.View
        style={[
          styles.dollarContainer,
          {
            transform: [
              { scale: scaleAnim },
              { rotate: rotateInterpolation },
            ],
            opacity: opacityAnim,
          },
        ]}
      >
        <Text style={[styles.dollarSign, { color: theme.currentTheme.colors.surface }]}>
          💰
        </Text>
        <Text style={[styles.amount, { color: theme.currentTheme.colors.surface }]}>
          +₱{amount.toLocaleString()}
        </Text>
      </Animated.View>

      {/* Confetti particles */}
      <View style={styles.confettiContainer}>
        {confettiAnims.map((confetti, index) => (
          <Animated.View
            key={index}
            style={[
              styles.confettiPiece,
              {
                backgroundColor: confettiColors[index % confettiColors.length],
                transform: [
                  { translateX: confetti.translateX },
                  { translateY: confetti.translateY },
                  { scale: confetti.scale },
                  {
                    rotate: confetti.rotate.interpolate({
                      inputRange: [0, 360],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
                opacity: confetti.opacity,
              },
            ]}
          />
        ))}
      </View>

      {/* Achievement text */}
      <Animated.View
        style={[
          styles.achievementContainer,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={[styles.achievementText, { color: theme.currentTheme.colors.surface }]}>
          🎉 Savings Added! 🎉
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  background: {
    position: 'absolute',
    width: width * 2,
    height: height * 2,
    borderRadius: width,
    opacity: 0.3,
  },
  dollarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dollarSign: {
    fontSize: 80,
    marginBottom: 10,
  },
  amount: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  confettiContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confettiPiece: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  achievementContainer: {
    position: 'absolute',
    bottom: height * 0.3,
    alignItems: 'center',
  },
  achievementText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});