/**
 * Budget Buddy Mobile - Toast Notification System
 * @license MIT
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface ToastOptions {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface Toast extends ToastOptions {
  id: string;
  visible: boolean;
  animation: Animated.Value;
  progress: Animated.Value;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

const { width } = Dimensions.get('window');

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { currentTheme, tokens } = useTheme();

  const showToast = useCallback((options: ToastOptions) => {
    const id = Date.now().toString();
    const animation = new Animated.Value(0);
    const progress = new Animated.Value(1);
    
    const newToast: Toast = {
      ...options,
      id,
      visible: true,
      animation,
      progress,
    };

    setToasts(prev => [...prev, newToast]);

    // Animate in
    Animated.spring(animation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();

    // Auto hide after duration and animate progress bar
    const duration = options.duration || (options.type === 'error' ? 5000 : 3000);
    Animated.timing(progress, {
      toValue: 0,
      duration,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) hideToast(id);
    });
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => {
      const toastIndex = prev.findIndex(t => t.id === id);
      if (toastIndex === -1) return prev;

      const toast = prev[toastIndex];
      
      // Animate out
      Animated.timing(toast.animation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setToasts(current => current.filter(t => t.id !== id));
      });

      return prev.map(t => 
        t.id === id ? { ...t, visible: false } : t
      );
    });
  }, []);

  const value: ToastContextValue = {
    showToast,
    hideToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <SafeAreaView style={styles.container} pointerEvents="box-none">
        {toasts.map(toast => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onHide={() => hideToast(toast.id)}
          />
        ))}
      </SafeAreaView>
    </ToastContext.Provider>
  );
};

interface ToastItemProps {
  toast: Toast;
  onHide: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onHide }) => {
  const { currentTheme, tokens } = useTheme();
  const getToastStyle = () => {
    switch (toast.type) {
      case 'success':
        return { backgroundColor: currentTheme.colors.success, icon: '✅' };
      case 'error':
        return { backgroundColor: currentTheme.colors.error, icon: '❌' };
      case 'warning':
        return { backgroundColor: currentTheme.colors.warning, icon: '⚠️' };
      case 'info':
      default:
        return { backgroundColor: currentTheme.colors.accent, icon: 'ℹ️' };
    }
  };

  const toastStyle = getToastStyle();

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: toastStyle.backgroundColor,
          borderRadius: tokens.radius.md,
          shadowColor: tokens.shadow.md.color,
          shadowOpacity: tokens.shadow.md.opacity,
          shadowRadius: tokens.shadow.md.radius,
          shadowOffset: tokens.shadow.md.offset,
        },
        {
          transform: [
            {
              translateY: toast.animation.interpolate({
                inputRange: [0, 1],
                outputRange: [-100, 0],
              }),
            },
          ],
          opacity: toast.animation,
        },
      ]}
    >
      <View style={styles.toastContent}>
        <Text style={styles.toastIcon}>{toastStyle.icon}</Text>
        <Text style={styles.toastMessage}>{toast.message}</Text>
        {toast.action && (
          <TouchableOpacity
            style={styles.toastAction}
            onPress={() => {
              toast.action?.onPress();
              onHide();
            }}
          >
            <Text style={styles.toastActionText}>{toast.action.label}</Text>
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={onHide}
      >
        <Text style={styles.closeText}>×</Text>
      </TouchableOpacity>

      {/* Progress Bar */}
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              backgroundColor: 'rgba(255,255,255,0.9)',
              width: toast.progress.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingTop: 10,
  },
  toast: {
    marginHorizontal: 16,
    marginVertical: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 8,
  },
  toastContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  toastIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  toastMessage: {
    flex: 1,
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  toastAction: {
    marginLeft: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
  },
  toastActionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    marginLeft: 8,
    padding: 4,
  },
  closeText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressTrack: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 6,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.25)'
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
});

export default ToastProvider;