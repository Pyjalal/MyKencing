import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { styles } from '../styles';

const QUICK_TIMES = [
  { labelKey: 'add_medicine.after_breakfast', value: '08:00' },
  { labelKey: 'add_medicine.after_lunch', value: '13:00' },
  { labelKey: 'add_medicine.after_dinner', value: '19:00' },
  { labelKey: 'add_medicine.before_bed', value: '22:00' },
] as const;

interface TimeScheduleSectionProps {
  selectedTimes: string[];
  onToggleTime: (value: string) => void;
  onAddCustomTime: () => void;
}

export const TimeScheduleSection: React.FC<TimeScheduleSectionProps> = ({
  selectedTimes,
  onToggleTime,
  onAddCustomTime,
}) => {
  const { t } = useTranslation();
  return (
    <View style={styles.section}>
      <Text style={styles.label}>{t('add_medicine.time_schedule')}</Text>
      <View style={styles.timeContainer}>
        {QUICK_TIMES.map((time) => {
          const isSelected = selectedTimes.includes(time.value);

          return (
            <TouchableOpacity
              key={time.value}
              style={[styles.timePill, isSelected && styles.timePillSelected]}
              onPress={() => onToggleTime(time.value)}
            >
              <Text style={[styles.timePillText, isSelected && styles.timePillTextSelected]}>
                {t(time.labelKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity style={styles.addTimeButton} onPress={onAddCustomTime}>
          <Text style={styles.addTimeButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

