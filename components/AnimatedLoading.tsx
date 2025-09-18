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

interface AnimatedLoadingProps {
  isLoading: boolean;
  size?: 'small' | 'medium' | 'large';
  type?: 'spinner' | 'dots' | 'pulse' | 'coins' | 'sparkles';
  text?: string;
  overlay?: boolean;
}

const { width, height } = Dimensions.get('window');

const AnimatedLoading: React.FC<AnimatedLoadingProps> = React.memo(({
  isLoading,
  size = 'medium',
  type = 'spinner',
  text,
  overlay = false,
}: AnimatedLoadingProps) => {
  const theme = useTheme();
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const dotAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const coinAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const sparkleAnims = useRef(
    Array.from({ length: 6 }, () => ({
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
      rotate: new Animated.Value(0),
    }))
  ).current;

  const sizes = {
    small: { container: 40, element: 20, fontSize: 12 },
    medium: { container: 60, element: 30, fontSize: 14 },
    large: { container: 80, element: 40, fontSize: 16 },
  };

  useEffect(() => {
    if (isLoading) {
      startAnimation();
    } else {
      stopAnimation();
    }
  }, [isLoading]);

  const startAnimation = () => {
    switch (type) {
      case 'spinner':
        Animated.loop(
          Animated.timing(spinAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ).start();
        break;

      case 'pulse':
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.3,
              duration: 600,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 600,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ])
        ).start();
        break;

      case 'dots':
        const dotAnimation = Animated.loop(
          Animated.stagger(
            200,
            dotAnims.map(dot =>
              Animated.sequence([
                Animated.timing(dot, {
                  toValue: 1,
                  duration: 300,
                  easing: Easing.out(Easing.back(2)),
                  useNativeDriver: true,
                }),
                Animated.timing(dot, {
                  toValue: 0,
                  duration: 300,
                  easing: Easing.in(Easing.back(2)),
                  useNativeDriver: true,
                }),
              ])
            )
          )
        );
        dotAnimation.start();
        break;

      case 'coins':
        const coinAnimation = Animated.loop(
          Animated.stagger(
            150,
            coinAnims.map(coin =>
              Animated.sequence([
                Animated.timing(coin, {
                  toValue: 1,
                  duration: 400,
                  easing: Easing.out(Easing.back(1.5)),
                  useNativeDriver: true,
                }),
                Animated.timing(coin, {
                  toValue: 0,
                  duration: 400,
                  easing: Easing.in(Easing.back(1.5)),
                  useNativeDriver: true,
                }),
              ])
            )
          )
        );
        coinAnimation.start();
        break;

      case 'sparkles':
        const sparkleAnimation = Animated.loop(
          Animated.stagger(
            100,
            sparkleAnims.map(sparkle =>
              Animated.parallel([
                Animated.sequence([
                  Animated.timing(sparkle.scale, {
                    toValue: 1,
                    duration: 300,
                    easing: Easing.out(Easing.back(2)),
                    useNativeDriver: true,
                  }),
                  Animated.timing(sparkle.scale, {
                    toValue: 0,
                    duration: 300,
                    easing: Easing.in(Easing.back(2)),
                    useNativeDriver: true,
                  }),
                ]),
                Animated.sequence([
                  Animated.timing(sparkle.opacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                  }),
                  Animated.timing(sparkle.opacity, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                  }),
                ]),
                Animated.timing(sparkle.rotate, {
                  toValue: 360,
                  duration: 600,
                  easing: Easing.linear,
                  useNativeDriver: true,
                }),
              ])
            )
          )
        );
        sparkleAnimation.start();
        break;
    }
  };

  const stopAnimation = () => {
    spinAnim.setValue(0);
    pulseAnim.setValue(1);
    dotAnims.forEach(dot => dot.setValue(0));
    coinAnims.forEach(coin => coin.setValue(0));
    sparkleAnims.forEach(sparkle => {
      sparkle.scale.setValue(0);
      sparkle.opacity.setValue(0);
      sparkle.rotate.setValue(0);
    });
  };

  const renderSpinner = () => {
    const spinInterpolation = spinAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <Animated.View
        style={[
          styles.spinner,
          {
            width: sizes[size].container,
            height: sizes[size].container,
            borderColor: theme.currentTheme.colors.primary,
            transform: [{ rotate: spinInterpolation }],
          },
        ]}
      />
    );
  };

  const renderPulse = () => (
    <Animated.View
      style={[
        styles.pulse,
        {
          width: sizes[size].container,
          height: sizes[size].container,
          backgroundColor: theme.currentTheme.colors.primary,
          transform: [{ scale: pulseAnim }],
        },
      ]}
    />
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {dotAnims.map((dot, index) => (
        <Animated.View
          key={index}
          style={[
            styles.dot,
            {
              width: sizes[size].element / 2,
              height: sizes[size].element / 2,
              backgroundColor: theme.currentTheme.colors.primary,
              transform: [{ scale: dot }],
            },
          ]}
        />
      ))}
    </View>
  );

  const renderCoins = () => (
    <View style={styles.coinsContainer}>
      {coinAnims.map((coin, index) => (
        <Animated.Text
          key={index}
          style={[
            styles.coin,
            {
              fontSize: sizes[size].element,
              color: theme.currentTheme.colors.primary,
              transform: [{ scale: coin }],
            },
          ]}
        >
          💰
        </Animated.Text>
      ))}
    </View>
  );

  const renderSparkles = () => (
    <View style={styles.sparklesContainer}>
      {sparkleAnims.map((sparkle, index) => (
        <Animated.Text
          key={index}
          style={[
            styles.sparkle,
            {
              fontSize: sizes[size].element,
              color: theme.currentTheme.colors.accent,
              transform: [
                { scale: sparkle.scale },
                {
                  rotate: sparkle.rotate.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
              opacity: sparkle.opacity,
            },
          ]}
        >
          ✨
        </Animated.Text>
      ))}
    </View>
  );

  const renderLoader = () => {
    switch (type) {
      case 'spinner':
        return renderSpinner();
      case 'pulse':
        return renderPulse();
      case 'dots':
        return renderDots();
      case 'coins':
        return renderCoins();
      case 'sparkles':
        return renderSparkles();
      default:
        return renderSpinner();
    }
  };

  if (!isLoading) return null;

  const containerStyle = overlay
    ? [styles.overlay, { backgroundColor: theme.currentTheme.colors.background + '90' }]
    : styles.container;

  return (
    <View style={containerStyle}>
      <View style={styles.content}>
        {renderLoader()}
        {text && (
          <Text
            style={[
              styles.text,
              {
                fontSize: sizes[size].fontSize,
                color: theme.currentTheme.colors.text,
                marginTop: 16,
              },
            ]}
          >
            {text}
          </Text>
        )}
      </View>
    </View>
  );
});

// Add display name for debugging
AnimatedLoading.displayName = 'AnimatedLoading';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    borderWidth: 3,
    borderTopColor: 'transparent',
    borderRadius: 1000,
  },
  pulse: {
    borderRadius: 1000,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 60,
  },
  dot: {
    borderRadius: 1000,
  },
  coinsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 120,
  },
  coin: {
    textAlign: 'center',
  },
  sparklesContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  sparkle: {
    position: 'absolute',
    textAlign: 'center',
  },
  text: {
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default AnimatedLoading;