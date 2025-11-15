import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useSettingsStore } from '../stores/settingsStore';

type PrivacyConsentScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;
};

export default function PrivacyConsentScreen({ navigation }: PrivacyConsentScreenProps) {
  const { t } = useTranslation();
  const [hasConsented, setHasConsented] = useState(false);
  const { updateSettings } = useSettingsStore();

  const handleAccept = async () => {
    if (!hasConsented) {
      return;
    }

    await updateSettings({
      consentGiven: true,
      consentDate: new Date().toISOString(),
      onboardingCompleted: true,
    });

    navigation.replace('Home');
  };

  const handleDecline = () => {
    setHasConsented(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.hero}>
          <Text style={styles.title}>{t('privacy.pdpa_title')}</Text>
          <Text style={styles.subtitle}>{t('privacy.pdpa_subtitle')}</Text>
        </View>

        <View style={styles.introContainer}>
          <Text style={styles.introText}>{t('privacy.pdpa_intro')}</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('privacy.pdpa_collection_title')}</Text>
          <Text style={styles.sectionText}>{t('privacy.pdpa_collection_text')}</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('privacy.pdpa_usage_title')}</Text>
          <Text style={styles.sectionText}>{t('privacy.pdpa_usage_text')}</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('privacy.pdpa_storage_title')}</Text>
          <Text style={styles.sectionText}>{t('privacy.pdpa_storage_text')}</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('privacy.pdpa_rights_title')}</Text>
          <Text style={styles.sectionText}>{t('privacy.pdpa_rights_text')}</Text>
        </View>

        <View style={styles.consentContainer}>
          <View style={styles.consentRow}>
            <Switch
              value={hasConsented}
              onValueChange={setHasConsented}
              trackColor={{ false: Colors.border.light, true: Colors.primary.light }}
              thumbColor={hasConsented ? Colors.primary.main : Colors.background.tertiary}
              accessibilityLabel={t('privacy.pdpa_consent_text')}
              accessibilityRole="switch"
            />
            <Text style={styles.consentText}>{t('privacy.pdpa_consent_text')}</Text>
          </View>
          {!hasConsented && (
            <Text style={styles.requiredNotice}>{t('privacy.pdpa_required_notice')}</Text>
          )}
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.declineButton]}
            onPress={handleDecline}
            accessibilityLabel={t('privacy.decline')}
            accessibilityRole="button"
          >
            <Text style={styles.declineButtonText}>{t('privacy.decline')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.acceptButton,
              !hasConsented && styles.acceptButtonDisabled,
            ]}
            onPress={handleAccept}
            disabled={!hasConsented}
            accessibilityLabel={t('privacy.i_agree')}
            accessibilityRole="button"
            accessibilityState={{ disabled: !hasConsented }}
          >
            <Text
              style={[
                styles.acceptButtonText,
                !hasConsented && styles.acceptButtonTextDisabled,
              ]}
            >
              {t('privacy.i_agree')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['2xl'],
    gap: Spacing.lg,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  introContainer: {
    backgroundColor: Colors.primary[50],
    padding: Spacing.lg,
    borderRadius: BorderRadius['2xl'],
    ...Shadows.sm,
  },
  introText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
  },
  sectionCard: {
    backgroundColor: Colors.background.card,
    padding: Spacing.lg,
    borderRadius: BorderRadius['2xl'],
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  sectionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
  },
  consentContainer: {
    backgroundColor: '#FFF8E6',
    padding: Spacing.lg,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    borderColor: Colors.primary.light,
    gap: Spacing.sm,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  consentText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
  },
  requiredNotice: {
    fontSize: Typography.fontSize.xs,
    color: Colors.status.error,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    ...Shadows.sm,
  },
  declineButton: {
    backgroundColor: Colors.background.card,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  declineButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  acceptButton: {
    backgroundColor: Colors.primary.main,
  },
  acceptButtonDisabled: {
    backgroundColor: Colors.neutral[300],
  },
  acceptButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary.contrast,
  },
  acceptButtonTextDisabled: {
    color: Colors.text.tertiary,
  },
});
