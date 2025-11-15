import React, { useState, useRef, useEffect } from 'react';
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
  Switch,
  Keyboard,
  KeyboardEvent,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/theme';
import { sendMessage } from '../services/chatclient';
import { Message } from '../types';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useVitalsStore } from '../stores/vitalsStore';
import { useMedicationStore } from '../stores/medicationStore';
import { enUS, ms as msLocale } from 'date-fns/locale';

export default function ChatBotScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: t('chatbot.firstMessage'), timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const scrollViewRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const [includeVitals, setIncludeVitals] = useState(false);
  const [includeMedications, setIncludeMedications] = useState(false);
  
  // Load vitals and medications from stores
  const vitals = useVitalsStore((state) => state.vitals);
  const weekDoses = useMedicationStore((state) => state.weekDoses);
  const loadVitals = useVitalsStore((state) => state.loadVitals);
  const loadWeekDoses = useMedicationStore((state) => state.loadWeekDoses);

  
  // Get current locale for date-fns
  const dateLocale = i18n.language === 'ms' ? msLocale : enUS;
  const keyboardVerticalOffset = Platform.OS === 'ios' ? headerHeight : 0;
  const [androidKeyboardHeight, setAndroidKeyboardHeight] = useState(0);

  // Load vitals and this week's medication doses on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await loadVitals(undefined, 30); // Load last 30 days of vitals
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        await loadWeekDoses(startOfWeek, endOfWeek);
        console.log('Vitals and medications loaded for chatbot context.');
      } catch (error) {
        console.error('Error loading vitals/medications for chatbot:', error);
      }
    };
    loadData();
  }, [loadVitals, loadWeekDoses]);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const handleKeyboardShow = (event: KeyboardEvent) => {
      setAndroidKeyboardHeight(Math.max((event.endCoordinates?.height ?? 0) - insets.bottom, 0));
    };

    const handleKeyboardHide = () => {
      setAndroidKeyboardHeight(0);
    };

    const showListener = Keyboard.addListener('keyboardDidShow', handleKeyboardShow);
    const hideListener = Keyboard.addListener('keyboardDidHide', handleKeyboardHide);

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, [insets.bottom]);

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

    // Send message with flags indicating which context to include
    const botReply = await sendMessage(history, includeVitals, includeMedications);
    const botMessage: Message = {
      role: 'assistant',
      content: botReply,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMessage]);
  } catch (error) {
    const errMessage: Message = {
      role: 'assistant',
      content: t('errors.failed_to_reach_chatbot'),
      timestamp: new Date()
    };
    // Remove the error message and the last user message from history
    setMessages(prev => prev.slice(0, -1)); // Remove the user message we just added
    console.error(error);
  } finally {
    setLoading(false);
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }
};


  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        <View style={styles.container}>
          <KeyboardAwareScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            enableOnAndroid
            enableAutomaticScroll
            extraScrollHeight={20}
            keyboardShouldPersistTaps="handled"
            keyboardOpeningTime={0}
            nestedScrollEnabled
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
                  <Text style={[styles.botText, styles.loadingText]}>
                    {t('chatbot.thinking')}
                  </Text>
                </View>
              </View>
            )}
          </KeyboardAwareScrollView>

          {/* FIXED INPUT BAR */}
          <View
            style={[
              styles.inputContainer,
              {
                paddingBottom: Math.max(insets.bottom, 12),
                marginBottom: Platform.OS === 'android' ? androidKeyboardHeight : 0,
              },
            ]}
          >
            <View style={styles.pillsRow}>
              <TouchableOpacity
                style={[
                  styles.pillButton,
                  includeVitals ? styles.pillEnabled : styles.pillDisabled,
                ]}
                onPress={() => setIncludeVitals(!includeVitals)}
              >
                <Text
                  style={[
                    styles.pillText,
                    includeVitals ? styles.pillTextEnabled : styles.pillTextDisabled,
                  ]}
                >
                  📊 Vitals
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.pillButton,
                  includeMedications ? styles.pillEnabled : styles.pillDisabled,
                ]}
                onPress={() => setIncludeMedications(!includeMedications)}
              >
                <Text
                  style={[
                    styles.pillText,
                    includeMedications ? styles.pillTextEnabled : styles.pillTextDisabled,
                  ]}
                >
                  💊 Meds
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder={t('chatbot.prompt')}
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
                <Text style={styles.sendText}>
                  {loading ? '...' : t('chatbot.send')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 0,
  },
  scrollContent: {
    padding: 12,
    paddingTop: 20,
    paddingBottom: 10,
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
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    flexWrap: 'wrap',
  },
  pillButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillEnabled: {
    backgroundColor: Colors.primary.main,
    borderColor: Colors.primary.main,
  },
  pillDisabled: {
    backgroundColor: 'transparent',
    borderColor: Colors.border.light,
    borderStyle: 'dashed',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  pillTextEnabled: {
    color: Colors.primary.contrast,
  },
  pillTextDisabled: {
    color: Colors.text.secondary,
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
    backgroundColor: Colors.background.card,
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
    flexDirection: 'column',
    borderTopWidth: 1,
    borderColor: Colors.border.light,
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: Colors.background.card,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: 12,
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
