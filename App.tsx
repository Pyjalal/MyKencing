import 'react-native-gesture-handler';
import './global.css';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { I18nextProvider } from 'react-i18next';
import AppNavigator from './src/navigation/AppNavigator';
import { initDatabase } from './src/services/database';
import { initializeEncryption } from './src/services/encryption';
import { seedMIMSDatabase } from './src/services/mims';
import { initializeNotifications } from './src/services/notifications';
import i18n from './src/services/i18n';
import { Colors, Typography } from './src/constants/theme';
import useNotifications from './src/hooks/useNotifications';
import { logEvent, EventType } from './src/services/analytics';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useNotifications();

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize encryption first
        await initializeEncryption();
        console.log('✓ Encryption initialized');

        // Initialize database
        await initDatabase();
        console.log('✓ Database initialized');

        // Seed MIMS database with sample medicines
        await seedMIMSDatabase();
        console.log('✓ MIMS database seeded');

        // Initialize notifications
        const notificationsEnabled = await initializeNotifications();
        console.log(`✓ Notifications ${notificationsEnabled ? 'enabled' : 'disabled'}`);

        // i18n is already initialized
        console.log(`✓ Language: ${i18n.language}`);

        // Small delay to ensure everything is ready
        await new Promise((resolve) => setTimeout(resolve, 500));

        try { await logEvent(EventType.AppOpened); } catch {}

        setIsReady(true);
      } catch (e) {
        console.error('Error initializing app:', e);
        setError((e as Error).message);
      }
    }

    prepare();
  }, []);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorTitle}>Initialization Error</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary.main} />
        <Text style={styles.loadingText}>Loading MyKencing...</Text>
      </View>
    );
  }

  return (
    <I18nextProvider i18n={i18n}>
      <AppNavigator />
      <StatusBar style="auto" />
    </I18nextProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
  },
  errorTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.status.error,
    marginBottom: 8,
  },
  errorText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
