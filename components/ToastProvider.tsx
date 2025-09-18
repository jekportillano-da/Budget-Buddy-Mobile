/**
 * Budget Buddy Mobile - Toast Notification System
 * @license MIT
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';

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

  const showToast = useCallback((options: ToastOptions) => {
    const id = Date.now().toString();
    const animation = new Animated.Value(0);
    
    const newToast: Toast = {
      ...options,
      id,
      visible: true,
      animation,
    };

    setToasts(prev => [...prev, newToast]);

    // Animate in
    Animated.spring(animation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();

    // Auto hide after duration
    const duration = options.duration || (options.type === 'error' ? 5000 : 3000);
    setTimeout(() => {
      hideToast(id);
    }, duration);
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
  const getToastStyle = () => {
    switch (toast.type) {
      case 'success':
        return { backgroundColor: '#34C759', icon: '✅' };
      case 'error':
        return { backgroundColor: '#FF3B30', icon: '❌' };
      case 'warning':
        return { backgroundColor: '#FF9500', icon: '⚠️' };
      case 'info':
      default:
        return { backgroundColor: '#007AFF', icon: 'ℹ️' };
    }
  };

  const toastStyle = getToastStyle();

  return (
    <Animated.View
      style={[
        styles.toast,
        { backgroundColor: toastStyle.backgroundColor },
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
});

export default ToastProvider;