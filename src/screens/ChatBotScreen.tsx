import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Colors } from '../constants/theme';
import { sendMessage } from '../services/chatclient';
import { Message } from '../types';
import { format } from 'date-fns';

export default function ChatBotScreen() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! How can I help you today?', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const [loading, setLoading] = useState(false);

const handleSend = async () => {
  if (!input.trim() || loading) return;

  const newUserMessage: Message = {
    role: 'user',
    content: input.trim(),
    timestamp: new Date()
  };
  const updatedMessages = [...messages, newUserMessage];

  setMessages(updatedMessages);
  setInput('');
  setLoading(true);

  try {
    // Send full chat history (converted to API format)
    const history: Message[] = updatedMessages.map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content,
      timestamp: m.timestamp
    }));

    const botReply = await sendMessage(history);
    const botMessage: Message = {
      role: 'assistant',
      content: botReply,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMessage]);
  } catch (error) {
    const errMessage: Message = {
      role: 'assistant',
      content: '⚠️ Failed to reach the chatbot.',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, errMessage]);
    console.error(error);
  } finally {
    setLoading(false);
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }
};


  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.contentContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          style={styles.chatContainer}
          ref={scrollViewRef}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg, i) => (
            <View
              key={i}
              style={[
                styles.messageBubble,
                msg.role === 'user' ? styles.userBubble : styles.botBubble,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  msg.role === 'user' ? styles.userText : styles.botText,
                ]}
              >
                {msg.content}
              </Text>
              {msg.timestamp && (
                <Text style={styles.timestamp}>
                  {format(msg.timestamp, 'HH:mm')}
                </Text>
              )}
            </View>
          ))}
          {loading && (
            <View style={[styles.messageBubble, styles.botBubble]}>
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={Colors.primary.main} />
                <Text style={[styles.botText, styles.loadingText]}>Thinking...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            placeholderTextColor={Colors.text.secondary}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]} 
            onPress={handleSend}
            disabled={!input.trim() || loading}
          >
          <Text style={styles.sendText}>{loading ? '...' : 'Send'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary
  },
  header: {
    backgroundColor: Colors.primary.main,
    paddingVertical: 16,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.primary.contrast,
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  chatContainer: {
    flex: 1,
    padding: 16,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
    maxWidth: '85%',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  userBubble: {
    backgroundColor: Colors.primary.main,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: Colors.background.secondary,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: Colors.primary.contrast,
  },
  botText: {
    color: Colors.text.primary,
  },
  timestamp: {
    fontSize: 11,
    color: Colors.text.secondary,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderColor: Colors.border.light,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background.secondary,
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: 8,
    paddingHorizontal: 12,
    color: Colors.text.primary,
    backgroundColor: Colors.background.primary,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  sendButton: {
    marginLeft: 12,
    backgroundColor: Colors.primary.dark,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-end',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendText: {
    color: Colors.primary.contrast,
    fontWeight: '600',
    fontSize: 15,
  },
});
