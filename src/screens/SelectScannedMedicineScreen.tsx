/**
 * Select Scanned Medicine Screen
 * Allows user to select from multiple medicine matches found by OCR
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ExtractedMedicine, MIMSSearchResult } from '../types';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import { Check } from 'lucide-react-native';

interface RouteParams {
  extractedMedicines: ExtractedMedicine[];
}

export default function SelectScannedMedicineScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { extractedMedicines } = (route.params as RouteParams) || {};

  // Merge and deduplicate API matches from ALL extracted medicines
  const allMatches = React.useMemo(() => {
    const matchMap = new Map<string, MIMSSearchResult>();

    extractedMedicines?.forEach(extracted => {
      extracted.apiMatches?.forEach(match => {
        // Keep highest confidence if duplicate
        const existing = matchMap.get(match.id);
        if (!existing || (match.confidence || 0) > (existing.confidence || 0)) {
          matchMap.set(match.id, match);
        }
      });
    });

    // Sort by confidence (highest first) and return top 5
    return Array.from(matchMap.values())
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
      .slice(0, 5);
  }, [extractedMedicines]);
  
  const apiMatches = allMatches;
  
  const [selectedMedicine, setSelectedMedicine] = useState<MIMSSearchResult | null>(null);

  const handleMedicineSelect = (medicine: MIMSSearchResult) => {
    setSelectedMedicine(medicine);
  };

  const handleConfirm = () => {
    if (!selectedMedicine) {
      Alert.alert(
        t('scan.select_medicine_title'),
        t('scan.select_medicine_message')
      );
      return;
    }

    // Replace the current screen with AddMedicine so back button goes to Home
    navigation.replace('AddMedicine', { selectedMedicine });
  };


    return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('scan.select_medicine')}</Text>
        <Text style={styles.subtitle}>
          {t('scan.select_best_match', { count: apiMatches.length })}
        </Text>
          </View>

            <FlatList
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
              data={apiMatches}
              keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={({ item: medicine }) => {
                const isSelected = selectedMedicine?.id === medicine.id;
                return (
                  <TouchableOpacity
                    style={[styles.matchItem, isSelected && styles.matchItemSelected]}
              onPress={() => handleMedicineSelect(medicine)}
                  >
                    <View style={styles.matchContent}>
                      <View style={styles.matchMain}>
                  <View style={styles.matchHeader}>
                        <Text style={[styles.matchName, isSelected && styles.matchNameSelected]}>
                          {medicine.brandName || medicine.genericName}
                        </Text>
                    {/* <Text style={styles.confidenceBadge}>
                      {Math.round((medicine.confidence || 0) * 100)}%
                    </Text> */}
                  </View>
                  <Text style={[styles.matchStrength, isSelected && styles.matchDetailsSelected]}>
                    {medicine.strength && `${medicine.strength}`}
                    {medicine.dosageForm && ` • ${medicine.dosageForm}`}
                  </Text>
                  <Text style={[styles.matchIngredients, isSelected && styles.matchDetailsSelected]} numberOfLines={2}>
                    {medicine.activeIngredients.slice(0, 3).join(', ')}
                    {medicine.activeIngredients.length > 3 && ` +${medicine.activeIngredients.length - 3} more`}
                        </Text>
                      </View>
                      {isSelected && (
                        <View style={styles.checkIcon}>
                    <Check size={24} color={Colors.accent.main} />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
              showsVerticalScrollIndicator={true}
            />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmButton, !selectedMedicine && styles.confirmButtonDisabled]}
          onPress={handleConfirm}
          disabled={!selectedMedicine}
        >
          <Text style={styles.confirmButtonText}>
            {t('scan.confirm_selection')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => navigation.replace('AddMedicine')}
        >
          <Text style={styles.skipButtonText}>{t('scan.skip_and_enter_manually')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    padding: Spacing.lg,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  matchItem: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.card,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  matchItemSelected: {
    backgroundColor: Colors.accent.light,
    borderColor: Colors.accent.main,
    borderWidth: 2,
    shadowColor: Colors.accent.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  matchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  matchMain: {
    flex: 1,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  matchName: {
    flex: 1,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginRight: Spacing.sm,
  },
  matchNameSelected: {
    color: Colors.text.primary,
  },
  confidenceBadge: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.accent.main,
    backgroundColor: Colors.accent.light,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
  },
  matchStrength: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  matchIngredients: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  matchDetailsSelected: {
    color: Colors.text.primary,
  },
  checkIcon: {
    marginLeft: Spacing.md,
    backgroundColor: Colors.accent.light,
    borderRadius: 20,
    padding: Spacing.xs,
  },
  footer: {
    padding: Spacing.lg,
    backgroundColor: Colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  confirmButton: {
    backgroundColor: Colors.accent.main,
    borderRadius: BorderRadius.button,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  skipButtonText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium,
  },
});
