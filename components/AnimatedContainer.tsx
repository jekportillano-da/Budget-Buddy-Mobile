import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';

interface AnimatedContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  delay?: number;
  duration?: number;
  slideDistance?: number;
}

export default function AnimatedContainer({
  children,
  style,
  delay = 0,
  duration = 600,
  slideDistance = 30,
}: AnimatedContainerProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(slideDistance)).current;

  useEffect(() => {
    const animationSequence = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]);

    animationSequence.start();
  }, [fadeAnim, slideAnim, delay, duration]);

  return (
    <Animated.View
      style={[
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}