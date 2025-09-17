import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import AnimatedButtonSimple from '../components/AnimatedButtonSimple';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');

  const { login, register, isLoading, error, clearError } = useAuthStore();

  const handleSubmit = async () => {
    clearError();
    
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    if (mode === 'register' && !fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, fullName);
      }
      
      // If successful, navigate to dashboard
      router.replace('/(tabs)/dashboard');
    } catch (err) {
      // Error is handled by the store, just show it
      Alert.alert('Authentication Error', error || 'Something went wrong');
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    clearError();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {mode === 'login' ? 'Login' : 'Register'}
      </Text>
      
      {mode === 'register' && (
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
        />
      )}
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password (min 6 characters)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      
      <AnimatedButtonSimple
        onPress={handleSubmit}
        title={isLoading ? 'Loading...' : (mode === 'login' ? 'Login' : 'Register')}
        variant="primary"
        disabled={isLoading}
        style={styles.animatedButton}
      />
      
      <TouchableOpacity style={styles.button} onPress={switchMode}>
        <Text style={styles.buttonText}>
          {mode === 'login' ? 'Need an account? Register' : 'Have an account? Login'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, styles.backButton]} onPress={handleGoBack}>
        <Text style={styles.buttonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: 'white',
    fontSize: 16,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#e5e5e5',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: '#2196F3',
  },
  backButton: {
    backgroundColor: '#6b7280',
    marginTop: 10,
  },
  buttonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  primaryButtonText: {
    color: 'white',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginBottom: 15,
    textAlign: 'center',
  },
  animatedButton: {
    width: '100%',
    marginBottom: 10,
  },
});