import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import AnimatedButtonSimple from '../components/AnimatedButtonSimple';
import AnimatedLoading from '../components/AnimatedLoading';
import AnimatedContainer from '../components/AnimatedContainer';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [passwordMismatch, setPasswordMismatch] = useState(false);

  const { login, register, isLoading, error, clearError } = useAuthStore();

  const handleSubmit = async () => {
    clearError();
    setPasswordMismatch(false);
    
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (mode === 'register') {
      if (!fullName.trim()) {
        Alert.alert('Error', 'Please enter your full name');
        return;
      }

      if (!confirmPassword.trim()) {
        Alert.alert('Error', 'Please confirm your password');
        return;
      }

      if (password !== confirmPassword) {
        setPasswordMismatch(true);
        Alert.alert('Error', 'Passwords do not match');
        return;
      }
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
      <AnimatedContainer delay={0} style={styles.titleContainer}>
        <Text style={styles.title}>
          {mode === 'login' ? 'Login' : 'Register'}
        </Text>
      </AnimatedContainer>
      
      <AnimatedContainer delay={200} style={styles.formContainer}>
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
          onChangeText={(text) => {
            setPassword(text);
            setPasswordMismatch(false);
          }}
          secureTextEntry
          autoCapitalize="none"
        />
        
        {mode === 'register' && (
          <TextInput
            style={[
              styles.input,
              passwordMismatch && styles.inputError
            ]}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setPasswordMismatch(false);
            }}
            secureTextEntry
            autoCapitalize="none"
          />
        )}
        
        {passwordMismatch && (
          <Text style={styles.errorText}>Passwords do not match</Text>
        )}
        
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
        
        {isLoading && (
          <View style={styles.loadingContainer}>
            <AnimatedLoading
              isLoading={isLoading}
              text={`${mode === 'login' ? 'Logging in' : 'Creating account'}...`}
              size="medium"
              type="spinner"
            />
          </View>
        )}
      </AnimatedContainer>
      
      <AnimatedContainer delay={400} style={styles.buttonsContainer}>
        <AnimatedButtonSimple
          onPress={handleSubmit}
          title={mode === 'login' ? 'Login' : 'Register'}
          variant="primary"
          disabled={isLoading}
          style={styles.animatedButton}
        />
        
        <AnimatedButtonSimple
          onPress={switchMode}
          title={mode === 'login' ? 'Need an account? Register' : 'Have an account? Login'}
          variant="secondary"
          disabled={isLoading}
          style={styles.animatedButton}
        />
        
        {mode === 'login' && (
          <TouchableOpacity
            onPress={() => router.push('/forgot-password')}
            disabled={isLoading}
            style={styles.forgotPasswordContainer}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        )}
        
        <AnimatedButtonSimple
          onPress={handleGoBack}
          title="Go Back"
          variant="secondary"
          disabled={isLoading}
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
  inputError: {
    borderColor: '#ef4444',
    borderWidth: 2,
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
  loadingContainer: {
    width: '100%',
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  formContainer: {
    width: '100%',
    alignItems: 'center',
  },
  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  forgotPasswordContainer: {
    marginVertical: 10,
    paddingVertical: 5,
  },
  forgotPasswordText: {
    color: '#2196F3',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});