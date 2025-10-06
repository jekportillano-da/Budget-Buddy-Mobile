import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Easing,
  View,
  Dimensions,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface AnimatedButtonProps {
  title: string;
  onPress: () => void;
  style?: any;
  textStyle?: any;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'small' | 'medium' | 'large';
  animationType?: 'explosion' | 'ripple' | 'bounce' | 'shimmer';
}

export default function AnimatedButton({
  title,
  onPress,
  style,
  textStyle,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  animationType = 'explosion',
}: AnimatedButtonProps) {
  const theme = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const explosionAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const particleAnims = useRef(
    Array.from({ length: 8 }, () => ({
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
    }))
  ).current;

  const colors = {
    primary: theme.currentTheme.colors.primary,
    secondary: theme.currentTheme.colors.secondary,
    success: theme.currentTheme.colors.success,
    warning: theme.currentTheme.colors.warning,
    error: theme.currentTheme.colors.error,
  };

  const sizes = {
    small: { paddingHorizontal: 12, paddingVertical: 8, fontSize: 14 },
    medium: { paddingHorizontal: 20, paddingVertical: 12, fontSize: 16 },
    large: { paddingHorizontal: 28, paddingVertical: 16, fontSize: 18 },
  };

  const startShimmerAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const createExplosionAnimation = () => {
    const angles = Array.from({ length: 8 }, (_, i) => (i * 45) * (Math.PI / 180));
    const distance = 50;
    
    return Animated.parallel([
      ...particleAnims.map((particle, index) => {
        const angle = angles[index];
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        
        return Animated.parallel([
          Animated.timing(particle.translateX, {
            toValue: x,
            duration: 600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(particle.translateY, {
            toValue: y,
            duration: 600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(particle.opacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(particle.opacity, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(particle.scale, {
              toValue: 1,
              duration: 200,
              easing: Easing.out(Easing.back(2)),
              useNativeDriver: true,
            }),
            Animated.timing(particle.scale, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
        ]);
      }),
    ]);
  };

  const handlePress = () => {
    if (disabled) return;

    switch (animationType) {
      case 'explosion':
        // Button press animation
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 0.95,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.8,
              duration: 100,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 1,
              duration: 100,
              useNativeDriver: true,
            }),
          ]),
        ]).start();

        // Explosion animation
        createExplosionAnimation().start(() => {
          // Reset particles
          particleAnims.forEach(particle => {
            particle.translateX.setValue(0);
            particle.translateY.setValue(0);
            particle.opacity.setValue(0);
            particle.scale.setValue(0);
          });
        });
        break;

      case 'bounce':
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: 150,
            easing: Easing.out(Easing.back(3)),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 150,
            easing: Easing.out(Easing.back(1)),
            useNativeDriver: true,
          }),
        ]).start();
        break;

      case 'ripple':
        Animated.sequence([
          Animated.timing(explosionAnim, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(explosionAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]).start();
        break;

      case 'shimmer':
        startShimmerAnimation();
        break;
    }

    onPress();
  };

  const buttonStyle = [
    styles.button,
    {
      backgroundColor: colors[variant],
      paddingHorizontal: sizes[size].paddingHorizontal,
      paddingVertical: sizes[size].paddingVertical,
      borderRadius: theme.tokens.radius.md,
      shadowColor: theme.tokens.shadow.md.color,
      shadowOpacity: theme.tokens.shadow.md.opacity,
      shadowRadius: theme.tokens.shadow.md.radius,
      shadowOffset: theme.tokens.shadow.md.offset,
    },
    disabled && styles.disabled,
    style,
  ];

  const textStyleCombined = [
    styles.text,
    {
      fontSize: sizes[size].fontSize,
      color: theme.currentTheme.colors.surface,
    },
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          buttonStyle,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handlePress}
          disabled={disabled}
          style={styles.touchable}
          activeOpacity={0.8}
        >
          <Text style={textStyleCombined}>{title}</Text>
          
          {/* Shimmer effect */}
          {animationType === 'shimmer' && (
            <Animated.View
              style={[
                styles.shimmer,
                {
                  backgroundColor: theme.currentTheme.colors.surface,
                  transform: [
                    {
                      translateX: shimmerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-100, 200],
                      }),
                    },
                  ],
                },
              ]}
            />
          )}
        </TouchableOpacity>

        {/* Ripple effect */}
        {animationType === 'ripple' && (
          <Animated.View
            style={[
              styles.ripple,
              {
                borderColor: theme.currentTheme.colors.surface,
                transform: [
                  {
                    scale: explosionAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 2],
                    }),
                  },
                ],
                opacity: explosionAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0],
                }),
              },
            ]}
          />
        )}
      </Animated.View>

      {/* Explosion particles */}
      {animationType === 'explosion' && (
        <View style={styles.particleContainer}>
          {particleAnims.map((particle, index) => (
            <Animated.View
              key={index}
              style={[
                styles.particle,
                {
                  backgroundColor: colors[variant],
                  transform: [
                    { translateX: particle.translateX },
                    { translateY: particle.translateY },
                    { scale: particle.scale },
                  ],
                  opacity: particle.opacity,
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  touchable: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
    elevation: 0,
    shadowOpacity: 0,
  },
  disabledText: {
    opacity: 0.7,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
    width: 30,
    transform: [{ skewX: '-20deg' }],
  },
  ripple: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginLeft: -10,
    marginTop: -10,
  },
  particleContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 0,
    height: 0,
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: -3,
    marginTop: -3,
  },
});