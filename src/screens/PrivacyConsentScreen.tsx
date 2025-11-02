import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../types';
import { Colors, Typography, Spacing } from '../constants/theme';
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

    // Save PDPA consent and mark onboarding as completed
    await updateSettings({
      consentGiven: true,
      consentDate: new Date().toISOString(),
      onboardingCompleted: true,
    });

    // Navigate to home
    navigation.replace('Home');
  };

  const handleDecline = () => {
    // User declined - can't use the app without consent
    // In a real app, you might want to show an explanation or exit
    setHasConsented(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <Text style={styles.title}>{t('pdpa_title')}</Text>
        <Text style={styles.subtitle}>{t('pdpa_subtitle')}</Text>

        <View style={styles.introContainer}>
          <Text style={styles.introText}>{t('pdpa_intro')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('pdpa_collection_title')}</Text>
          <Text style={styles.sectionText}>{t('pdpa_collection_text')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('pdpa_usage_title')}</Text>
          <Text style={styles.sectionText}>{t('pdpa_usage_text')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('pdpa_storage_title')}</Text>
          <Text style={styles.sectionText}>{t('pdpa_storage_text')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('pdpa_rights_title')}</Text>
          <Text style={styles.sectionText}>{t('pdpa_rights_text')}</Text>
        </View>

        <View style={styles.consentContainer}>
          <View style={styles.consentRow}>
            <Switch
              value={hasConsented}
              onValueChange={setHasConsented}
              trackColor={{ false: Colors.border.light, true: Colors.primary.light }}
              thumbColor={hasConsented ? Colors.primary.main : Colors.background.tertiary}
              accessibilityLabel={t('pdpa_consent_text')}
              accessibilityRole="switch"
            />
            <Text style={styles.consentText}>{t('pdpa_consent_text')}</Text>
          </View>
          {!hasConsented && (
            <Text style={styles.requiredNotice}>{t('pdpa_required_notice')}</Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.declineButton]}
          onPress={handleDecline}
          accessibilityLabel={t('decline')}
          accessibilityRole="button"
        >
          <Text style={styles.declineButtonText}>{t('decline')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.acceptButton,
            !hasConsented && styles.acceptButtonDisabled,
          ]}
          onPress={handleAccept}
          disabled={!hasConsented}
          accessibilityLabel={t('i_agree')}
          accessibilityRole="button"
          accessibilityState={{ disabled: !hasConsented }}
        >
          <Text style={[
            styles.acceptButtonText,
            !hasConsented && styles.acceptButtonTextDisabled,
          ]}>
            {t('i_agree')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
  },
  introContainer: {
    backgroundColor: Colors.primary.light,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.lg,
  },
  introText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  sectionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
  },
  consentContainer: {
    backgroundColor: Colors.background.secondary,
    padding: Spacing.md,
    borderRadius: 8,
    marginTop: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.primary.main,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  consentText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    marginLeft: Spacing.md,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
  },
  requiredNotice: {
    fontSize: Typography.fontSize.xs,
    color: Colors.status.error,
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    backgroundColor: Colors.background.primary,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
  },
  declineButton: {
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border.main,
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
    backgroundColor: Colors.background.tertiary,
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
