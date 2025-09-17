import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import AnimatedButtonSimple from '../components/AnimatedButtonSimple';
import AnimatedContainer from '../components/AnimatedContainer';

export default function Index() {
  const { isAuthenticated, validateSession } = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      await validateSession();
      setIsReady(true);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    // Redirect authenticated users to dashboard only after component is ready
    if (isReady && isAuthenticated) {
      // Small delay to ensure navigation system is ready
      setTimeout(() => {
        router.replace('/(tabs)/dashboard');
      }, 100);
    }
  }, [isAuthenticated, isReady]);

  const handleNavigate = () => {
    router.push('/(tabs)/dashboard');
  };

  const handleLoginTest = () => {
    router.push('/login');
  };

  return (
    <View style={styles.container}>
      <AnimatedContainer style={styles.content}>
        <Text style={styles.title}>Budget Buddy</Text>
        <Text style={styles.subtitle}>Welcome to your personal finance manager</Text>
        
        <AnimatedButtonSimple
          onPress={handleLoginTest}
          title="Login / Register"
          variant="primary"
          style={styles.animatedButton}
        />
        
        <AnimatedButtonSimple
          onPress={handleNavigate}
          title="Guest Mode"
          variant="secondary"
          style={styles.animatedButton}
        />
      </AnimatedContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e40af',
    padding: 20,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: 'white',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  testButton: {
    marginTop: 15,
    backgroundColor: '#10b981',
  },
  buttonText: {
    color: '#1e40af',
    fontWeight: 'bold',
    fontSize: 16,
  },
  animatedButton: {
    width: '80%',
    marginBottom: 15,
  },
});
