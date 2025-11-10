import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useTranslation } from 'react-i18next';

interface OnboardingPersonalInfoScreenProps {
  onNext: (data: { age: number; gender: 'male' | 'female' | 'other'; weight: number }) => void;
  onBack: () => void;
  onSkip: () => void;
  initialData?: { age?: number; gender?: 'male' | 'female' | 'other'; weight?: number };
}

export default function OnboardingPersonalInfoScreen({
  onNext,
  onBack,
  onSkip,
  initialData,
}: OnboardingPersonalInfoScreenProps) {
  const { t } = useTranslation();
  const [age, setAge] = useState(initialData?.age?.toString() || '');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(initialData?.gender || 'male');
  const [weight, setWeight] = useState(initialData?.weight?.toString() || '');
  const [showGenderPicker, setShowGenderPicker] = useState(false);

  const handleNext = () => {
    const ageNum = parseInt(age, 10);
    const weightNum = parseFloat(weight);

    if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      Alert.alert(t('onboarding.valid_age_alert'));
      return;
    }

    if (isNaN(weightNum) || weightNum < 1 || weightNum > 500) {
      Alert.alert(t('onboarding.valid_weight_alert'));
      return;
    }

    onNext({ age: ageNum, gender, weight: weightNum });
  };

  const isFormValid = () => {
    const ageNum = parseInt(age, 10);
    const weightNum = parseFloat(weight);
    return !isNaN(ageNum) && ageNum >= 1 && !isNaN(weightNum) && weightNum >= 1;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarFill} />
        </View>
        <TouchableOpacity onPress={onSkip}>
          <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.title}>{t('onboarding.tell_us_more')}</Text>

        {/* Age Input */}
        <TouchableOpacity style={styles.inputCard} activeOpacity={0.7}>
          <TextInput
            style={styles.inputValue}
            value={age}
            onChangeText={setAge}
            placeholder={t('onboarding.enter_age')}
            placeholderTextColor={Colors.text.tertiary}
            keyboardType="numeric"
            maxLength={3}
          />
          <Text style={styles.inputLabel}>{t('onboarding.your_age')}</Text>
        </TouchableOpacity>

        {/* Gender Selector */}
        <TouchableOpacity
          style={styles.inputCard}
          activeOpacity={0.7}
          onPress={() => setShowGenderPicker(true)}
        >
          <Text style={styles.inputValue}>
            {t(`onboarding.${gender}`)}
          </Text>
          <Text style={styles.inputLabel}>{t('onboarding.your_gender')}</Text>
        </TouchableOpacity>

        {/* Weight Input */}
        <TouchableOpacity style={styles.inputCard} activeOpacity={0.7}>
          <TextInput
            style={styles.inputValue}
            value={weight}
            onChangeText={setWeight}
            placeholder={t('onboarding.enter_weight')}
            placeholderTextColor={Colors.text.tertiary}
            keyboardType="decimal-pad"
            maxLength={5}
          />
          <Text style={styles.inputLabel}>{t('onboarding.your_weight')}</Text>
        </TouchableOpacity>

        {/* Progress Dots */}
        <View style={styles.dotsContainer}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        {/* Next Button */}
        <TouchableOpacity
          style={[styles.nextButton, !isFormValid() && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!isFormValid()}
        >
          <Text style={styles.nextButtonText}>{t('onboarding.next')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Gender Picker Modal */}
      <Modal
        visible={showGenderPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGenderPicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowGenderPicker(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('onboarding.select_gender')}</Text>
            {(['male', 'female', 'other'] as const).map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.modalOption, gender === g && styles.modalOptionSelected]}
                onPress={() => {
                  setGender(g);
                  setShowGenderPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    gender === g && styles.modalOptionTextSelected,
                  ]}
                >
                  {t(`onboarding.${g}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl + 20,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 28,
    color: Colors.text.primary,
  },
  progressBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.neutral[300],
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '33%',
    height: '100%',
    backgroundColor: Colors.primary.main,
    borderRadius: 3,
  },
  skipText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.medium,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.xl + Spacing.md,
    lineHeight: 40,
  },
  inputCard: {
    backgroundColor: Colors.background.card,
    borderRadius: 24,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  inputValue: {
    fontSize: 28,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl + Spacing.lg,
    marginBottom: Spacing.xl,
  },
  dot: {
    width: 40,
    height: 6,
    backgroundColor: Colors.neutral[300],
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: Colors.primary.main,
  },
  nextButton: {
    backgroundColor: Colors.primary.main,
    borderRadius: 28,
    paddingVertical: Spacing.lg + 4,
    alignItems: 'center',
    marginBottom: Spacing.xl,
    ...Shadows.md,
  },
  nextButtonDisabled: {
    backgroundColor: Colors.neutral[300],
  },
  nextButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary.contrast,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '80%',
    maxWidth: 400,
    ...Shadows.xl,
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  modalOptionSelected: {
    backgroundColor: Colors.primary.light,
  },
  modalOptionText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  modalOptionTextSelected: {
    color: Colors.primary.contrast,
    fontWeight: Typography.fontWeight.semibold,
  },
});