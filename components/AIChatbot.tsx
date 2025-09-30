import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useSavingsStore } from '../stores/savingsStore';
import { cohereAIService } from '../services/cohereAIService';
import { canUseAI, getTierFeatureText, getSavingsNeededForNextTier } from '../shared/entities/tier/tierAccess';
import { Text as UIText, Button as UIButton, Input as UIInput, Card } from '../shared/ui/components';
import AnimatedContainer from './AnimatedContainer';
import AnimatedButtonSimple from './AnimatedButtonSimple';
import AnimatedLoading from './AnimatedLoading';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface AIChatbotProps {
  visible: boolean;
  onClose: () => void;
}

export default function AIChatbot({ visible, onClose }: AIChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: 'Hello! I\'m your AI financial assistant. How can I help you with your budget today?',
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Get user's current tier from savings store
  const { currentTier, currentBalance } = useSavingsStore();

  // Check if user has access to AI chatbot using centralized tier logic
  const hasAccess = canUseAI(currentTier.name);
  const savingsNeeded = getSavingsNeededForNextTier(currentBalance, currentTier.name);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    // Check tier access first
    if (!hasAccess) {
      Alert.alert(
        'AI Chat Locked',
        'AI chat requires Bronze tier or higher. Save ₱100+ to unlock this feature!',
        [{ text: 'OK' }]
      );
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Use real Cohere AI service for response
      const aiResponse = await cohereAIService.chatWithAI(inputText.trim());
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI Chat Error:', error);
      Alert.alert('Error', 'Failed to get AI response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <AnimatedContainer style={styles.container}>
      <View style={styles.header}>
        <UIText variant="h3" color="surface" weight="bold">
          AI Financial Assistant
        </UIText>
        <Text style={styles.tierBadge}>
          {currentTier.name} • ₱{currentBalance.toLocaleString()}
        </Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <UIText color="surface" weight="bold" style={{ fontSize: 20 }}>
            ✕
          </UIText>
        </TouchableOpacity>
      </View>

      {!hasAccess ? (
        <View style={styles.lockedContainer}>
          <UIText style={styles.lockedIcon}>🔒</UIText>
          <UIText variant="h2" color="text" weight="bold" align="center" style={{ marginBottom: 15 }}>
            AI Chat Locked
          </UIText>
          <UIText variant="body" color="textSecondary" align="center" style={{ marginBottom: 20, lineHeight: 24 }}>
            Save ₱100+ to reach Bronze tier and unlock AI financial assistance!
          </UIText>
          <UIText variant="body" color="accent" weight="semibold" style={{ marginBottom: 5 }}>
            Current savings: ₱{currentBalance.toLocaleString()}
          </UIText>
          <UIText variant="body" color="error" weight="semibold">
            Need: ₱{savingsNeeded.amountNeeded.toLocaleString()} more {savingsNeeded.nextTier ? `to reach ${savingsNeeded.nextTier}` : ''}
          </UIText>
        </View>
      ) : (
        <>
          <ScrollView style={styles.messagesContainer}>
            {messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageContainer,
                  message.isUser ? styles.userMessage : styles.aiMessage,
                ]}
              >
                <Text style={[
                  styles.messageText,
                  message.isUser ? styles.userMessageText : styles.aiMessageText,
                ]}>
                  {message.text}
                </Text>
                <Text style={styles.messageTime}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            ))}
            {isLoading && (
              <View style={styles.loadingContainer}>
                <AnimatedLoading isLoading={true} />
                <Text style={styles.loadingText}>AI is thinking...</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.inputContainer}>
            <UIInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask me about your finances..."
              multiline
              maxLength={500}
              isDisabled={isLoading}
              style={styles.textInput}
            />
            <UIButton
              variant="primary"
              size="md"
              onPress={sendMessage}
              isDisabled={!inputText.trim() || isLoading}
              isLoading={isLoading}
              style={styles.sendButton}
            >
              Send
            </UIButton>
          </View>

          <View style={styles.tierInfo}>
            <UIText variant="caption" color="textSecondary" align="center">
              {getTierFeatureText(currentTier.name)}
            </UIText>
          </View>
        </>
      )}
    </AnimatedContainer>
  );
}

// Helper functions removed - now using centralized tier access logic

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    backgroundColor: '#4A90E2',
    padding: 15,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  tierBadge: {
    color: '#fff',
    fontSize: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginHorizontal: 10,
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  lockedIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  lockedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  lockedMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  currentProgress: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '600',
    marginBottom: 5,
  },
  remainingAmount: {
    fontSize: 14,
    color: '#E74C3C',
    fontWeight: '600',
  },
  messagesContainer: {
    flex: 1,
    padding: 15,
  },
  messageContainer: {
    marginVertical: 5,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    maxWidth: '80%',
  },
  userMessage: {
    backgroundColor: '#4A90E2',
    alignSelf: 'flex-end',
  },
  aiMessage: {
    backgroundColor: '#F0F0F0',
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#fff',
  },
  aiMessageText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 5,
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginVertical: 10,
  },
  loadingText: {
    marginLeft: 10,
    color: '#666',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  tierInfo: {
    backgroundColor: '#F8F9FA',
    padding: 10,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  tierInfoText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});