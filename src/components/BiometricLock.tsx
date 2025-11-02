import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors, Typography, Spacing } from '../constants/theme';
import {
  authenticateWithBiometric,
  isBiometricAvailable,
  isBiometricEnrolled,
  getSupportedBiometricTypes,
  getBiometricTypeName,
} from '../services/biometric';

interface BiometricLockProps {
  onAuthenticated: () => void;
  onCancel?: () => void;
  autoPrompt?: boolean;
}

export default function BiometricLock({
  onAuthenticated,
  onCancel,
  autoPrompt = true,
}: BiometricLockProps) {
  const { t } = useTranslation();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [biometricTypeName, setBiometricTypeName] = useState('Biometric');

  useEffect(() => {
    initializeBiometric();
  }, []);

  const initializeBiometric = async () => {
    try {
      const types = await getSupportedBiometricTypes();
      if (types.length > 0) {
        setBiometricTypeName(getBiometricTypeName(types[0]));
      }

      if (autoPrompt) {
        await handleAuthenticate();
      }
    } catch (error) {
      console.error('Error initializing biometric:', error);
    }
  };

  const handleAuthenticate = async () => {
    setIsAuthenticating(true);
    setError(null);

    try {
      const result = await authenticateWithBiometric(t('biometric_prompt'));

      if (result.success) {
        onAuthenticated();
      } else {
        setError(result.error || t('error'));
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : t('error'));
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🔒</Text>
        </View>

        <Text style={styles.title}>{t('biometric_title')}</Text>
        <Text style={styles.subtitle}>{t('biometric_prompt')}</Text>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleAuthenticate}
          disabled={isAuthenticating}
          accessibilityLabel={t('biometric_prompt')}
          accessibilityRole="button"
        >
          {isAuthenticating ? (
            <ActivityIndicator color={Colors.primary.contrast} />
          ) : (
            <>
              <Text style={styles.primaryButtonIcon}>🔓</Text>
              <Text style={styles.primaryButtonText}>
                {t('biometric_enable_button', { defaultValue: `Unlock with ${biometricTypeName}` })}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {onCancel && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onCancel}
            accessibilityLabel={t('cancel')}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryButtonText}>{t('cancel')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          🔐 {t('privacy_message', { defaultValue: 'Your data is encrypted and secure' })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  icon: {
    fontSize: 50,
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: Colors.status.errorLight,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.lg,
    width: '100%',
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.status.error,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.primary.main,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 12,
    minWidth: 250,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  primaryButtonIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  primaryButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary.contrast,
  },
  secondaryButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 12,
    minWidth: 250,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.secondary,
  },
  footer: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
});
