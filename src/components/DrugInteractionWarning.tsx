import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors, Typography, Spacing } from '../constants/theme';

interface DrugInteractionWarningProps {
  interactions: string[];
  severity?: 'high' | 'medium' | 'low';
  testID?: string;
}

export default function DrugInteractionWarning({
  interactions,
  severity = 'high',
  testID,
}: DrugInteractionWarningProps) {
  const { t } = useTranslation();

  if (!interactions || interactions.length === 0) {
    return null;
  }

  const getSeverityColor = () => {
    switch (severity) {
      case 'high':
        return Colors.status.error;
      case 'medium':
        return Colors.status.warning;
      case 'low':
        return Colors.status.info;
      default:
        return Colors.status.warning;
    }
  };

  const getSeverityBackgroundColor = () => {
    switch (severity) {
      case 'high':
        return Colors.status.errorLight;
      case 'medium':
        return Colors.status.warningLight;
      case 'low':
        return Colors.status.infoLight;
      default:
        return Colors.status.warningLight;
    }
  };

  const getSeverityLabel = () => {
    switch (severity) {
      case 'high':
        return t('drug_interaction.high');
      case 'medium':
        return t('drug_interaction.medium');
      case 'low':
        return t('drug_interaction.low');
      default:
        return t('drug_interaction.warning');
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: getSeverityBackgroundColor() },
      ]}
      testID={testID}
      accessibilityRole="alert"
      accessibilityLabel={`${getSeverityLabel()}: ${interactions.join('. ')}`}
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: getSeverityColor() }]}>
          <Text style={styles.icon}>⚠️</Text>
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.severityLabel, { color: getSeverityColor() }]}>
            {getSeverityLabel()}
          </Text>
          <Text style={styles.title}>
            {t('drug_interaction.title')}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.description}>
          {t('drug_interaction.description')}
        </Text>

        {interactions.map((interaction, index) => (
          <View key={index} style={styles.interactionItem}>
            <View style={styles.bullet} />
            <Text style={styles.interactionText}>{interaction}</Text>
          </View>
        ))}

        <Text style={styles.disclaimer}>
          {t('drug_interaction.disclaimer')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: Spacing.md,
    marginVertical: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.status.warning,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  icon: {
    fontSize: 20,
  },
  headerTextContainer: {
    flex: 1,
  },
  severityLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  content: {
    marginTop: Spacing.sm,
  },
  description: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
  },
  interactionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
    paddingLeft: Spacing.sm,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.status.error,
    marginTop: 6,
    marginRight: Spacing.sm,
  },
  interactionText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
  },
  disclaimer: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    fontStyle: 'italic',
    lineHeight: Typography.fontSize.xs * Typography.lineHeight.relaxed,
  },
});
