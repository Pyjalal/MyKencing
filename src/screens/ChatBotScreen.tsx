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
} from 'react-native';
import { Colors } from '../constants/theme';
import { sendMessage } from '../services/chatclient'; // 👈 import your chat API handler
import { Message } from '../types';

export default function ChatBotScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const [loading, setLoading] = useState(false);

const handleSend = async () => {
  if (!input.trim() || loading) return;

  const newUserMessage: Message = { role: 'user', content: input.trim() };
  const updatedMessages = [...messages, newUserMessage];

  setMessages(updatedMessages);
  setInput('');
  setLoading(true);

  try {
    // Send full chat history (converted to API format)
    const history: Message[] = updatedMessages.map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content,
    }));

    const botReply = await sendMessage(history);
    const botMessage: Message = { role: 'assistant', content: botReply };

    setMessages(prev => [...prev, botMessage]);
  } catch (error) {
    const errMessage: Message = { role: 'assistant', content: '⚠️ Failed to reach the chatbot.' };
    setMessages(prev => [...prev, errMessage]);
    console.error(error);
  } finally {
    setLoading(false);
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }
};


  return (
    <KeyboardAvoidingView
      style={styles.container}
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
          </View>
        ))}
        {loading && (
          <View style={[styles.messageBubble, styles.botBubble]}>
            <Text style={styles.botText}>...</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask something..."
          placeholderTextColor={Colors.text.secondary}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendText}>{loading ? '...' : 'Send'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  chatContainer: { flex: 1, padding: 10 },
  messageBubble: {
    padding: 10,
    borderRadius: 12,
    marginVertical: 4,
    maxWidth: '80%',
  },
  userBubble: {
    backgroundColor: Colors.primary.main,
    alignSelf: 'flex-end',
  },
  botBubble: {
    backgroundColor: Colors.background.secondary,
    alignSelf: 'flex-start',
  },
  messageText: { fontSize: 15 },
  userText: { color: Colors.primary.contrast },
  botText: { color: Colors.text.primary },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: Colors.border.light,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Colors.background.secondary,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    color: Colors.text.primary,
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: Colors.primary.main,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  sendText: {
    color: Colors.primary.contrast,
    fontWeight: '600',
  },
});
