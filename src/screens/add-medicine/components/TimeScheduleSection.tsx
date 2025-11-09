import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles';

const QUICK_TIMES = [
  { label: 'After Breakfast', value: '08:00' },
  { label: 'After Lunch', value: '13:00' },
  { label: 'After Dinner', value: '19:00' },
  { label: 'Before Bed', value: '22:00' },
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
}) => (
  <View style={styles.section}>
    <Text style={styles.label}>Time & Schedule</Text>
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
              {time.label}
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

