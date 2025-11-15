import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { styles } from '../styles';

interface DurationSectionProps {
  startDate: Date;
  endDate: Date | null;
  onStartPress: () => void;
  onEndPress: () => void;
}

export const DurationSection: React.FC<DurationSectionProps> = ({
  startDate,
  endDate,
  onStartPress,
  onEndPress,
}) => {
  const { t } = useTranslation();
  return (
    <View style={styles.section}>
      <Text style={styles.label}>{t('add_medicine.duration')}</Text>
      <View style={styles.rowSection}>
        <TouchableOpacity style={[styles.input, styles.flexInput, styles.dateInput]} onPress={onStartPress}>
          <Text style={styles.dateText}>{startDate.toLocaleDateString()}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.input, styles.flexInput, styles.dateInput]} onPress={onEndPress}>
          <Text style={[styles.dateText, !endDate && styles.placeholderText]}>
            {endDate ? endDate.toLocaleDateString() : t('add_medicine.end_date')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

