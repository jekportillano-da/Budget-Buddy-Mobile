import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Alert, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import AnimatedButtonSimple from '../components/AnimatedButtonSimple';
import AnimatedLoading from '../components/AnimatedLoading';
import AnimatedContainer from '../components/AnimatedContainer';
import { logger } from '../utils/logger';

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);

  useEffect(() => {
    // Check if passwords match when either field changes
    setPasswordsMatch(password === confirmPassword || confirmPassword === '');
  }, [password, confirmPassword]);

  const handleSubmit = async () => {
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (!token) {
      Alert.alert('Error', 'Invalid reset token');
      return;
    }

    setIsLoading(true);

    try {
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://budget-buddy-mobile.onrender.com';
      
      logger.info('Submitting password reset');

      const response = await fetch(`${backendUrl}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          new_password: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        logger.error('Password reset failed', { 
          status: response.status, 
          error: errorData 
        });
        
        if (response.status === 400) {
          throw new Error('Invalid or expired reset token');
        }
        throw new Error(`Request failed: ${response.status}`);
      }

      const data = await response.json();
      logger.info('Password reset successful');

      Alert.alert(
        'Success!', 
        'Your password has been reset successfully. You can now log in with your new password.',
        [
          { 
            text: 'OK', 
            onPress: () => router.replace('/login')
          }
        ]
      );

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Password reset error', { error: errorMessage });
      
      Alert.alert(
        'Error', 
        errorMessage.includes('Invalid or expired') 
          ? 'This reset link is invalid or has expired. Please request a new password reset.'
          : 'Unable to reset password. Please try again later.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <AnimatedContainer delay={0} style={styles.titleContainer}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter your new password below.
        </Text>
      </AnimatedContainer>
      
      <AnimatedContainer delay={200} style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="New Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
        />
        
        <TextInput
          style={[
            styles.input,
            !passwordsMatch ? styles.inputError : null
          ]}
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
        />
        
        {!passwordsMatch && (
          <Text style={styles.errorText}>Passwords do not match</Text>
        )}
        
        {isLoading && (
          <View style={styles.loadingContainer}>
            <AnimatedLoading
              isLoading={isLoading}
              text="Resetting password..."
              size="medium"
              type="spinner"
            />
          </View>
        )}
      </AnimatedContainer>
      
      <AnimatedContainer delay={400} style={styles.buttonsContainer}>
        <AnimatedButtonSimple
          onPress={handleSubmit}
          title="Reset Password"
          variant="primary"
          disabled={isLoading || !passwordsMatch || !password || !confirmPassword}
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
  inputError: {
    borderColor: '#ff4444',
    borderWidth: 2,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginTop: -15,
    marginBottom: 15,
    textAlign: 'center',
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
});