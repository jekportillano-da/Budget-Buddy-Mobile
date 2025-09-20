import React, { useState } from 'react';
import { View, Text, TextInput, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import AnimatedButtonSimple from '../components/AnimatedButtonSimple';
import AnimatedLoading from '../components/AnimatedLoading';
import AnimatedContainer from '../components/AnimatedContainer';
import { logger } from '../utils/logger';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      // Call the backend forgot password endpoint
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://budget-buddy-mobile.onrender.com';
      
      logger.info('Sending forgot password request', { email });

      const response = await fetch(`${backendUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        logger.error('Forgot password request failed', { 
          status: response.status, 
          error: errorData 
        });
        throw new Error(`Request failed: ${response.status}`);
      }

      const data = await response.json();
      logger.info('Forgot password request successful', { email });

      setEmailSent(true);
      Alert.alert(
        'Email Sent!', 
        'If an account with that email exists, you will receive a password reset link shortly.',
        [
          { 
            text: 'OK', 
            onPress: () => router.back() 
          }
        ]
      );

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Forgot password error', { error: errorMessage, email });
      Alert.alert(
        'Error', 
        'Unable to send reset email. Please try again later.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  if (emailSent) {
    return (
      <View style={styles.container}>
        <AnimatedContainer delay={0} style={styles.successContainer}>
          <Text style={styles.successTitle}>Email Sent!</Text>
          <Text style={styles.successMessage}>
            Check your email for a password reset link. It may take a few minutes to arrive.
          </Text>
          <AnimatedButtonSimple
            onPress={handleGoBack}
            title="Back to Login"
            variant="primary"
            style={styles.button}
          />
        </AnimatedContainer>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AnimatedContainer delay={0} style={styles.titleContainer}>
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>
          Enter your email address and we'll send you a link to reset your password.
        </Text>
      </AnimatedContainer>
      
      <AnimatedContainer delay={200} style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
        />
        
        {isLoading && (
          <View style={styles.loadingContainer}>
            <AnimatedLoading
              isLoading={isLoading}
              text="Sending reset email..."
              size="medium"
              type="spinner"
            />
          </View>
        )}
      </AnimatedContainer>
      
      <AnimatedContainer delay={400} style={styles.buttonsContainer}>
        <AnimatedButtonSimple
          onPress={handleSubmit}
          title="Send Reset Email"
          variant="primary"
          disabled={isLoading}
          style={styles.button}
        />
        
        <AnimatedButtonSimple
          onPress={handleGoBack}
          title="Back to Login"
          variant="secondary"
          disabled={isLoading}
          style={styles.button}
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
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  formContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    backgroundColor: 'white',
    fontSize: 16,
  },
  loadingContainer: {
    width: '100%',
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    width: '100%',
    marginBottom: 15,
  },
  successContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#22c55e',
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
});