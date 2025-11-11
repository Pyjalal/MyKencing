import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { X, Plus } from 'lucide-react-native';
import { Colors, Typography, Spacing } from '../constants/theme';

interface TimePickerPillProps {
  times: string[];
  onEditTime: (time: string) => void;
  onRemoveTime: (time: string) => void;
  onAddTime: () => void;
}

export function TimePickerPill({ times, onEditTime, onRemoveTime, onAddTime }: TimePickerPillProps) {
  return (
    <View style={styles.timeContainer}>
      {times.map((time) => (
        <View key={time} style={styles.timePillWithRemove}>
          <TouchableOpacity
            onPress={() => onEditTime(time)}
            style={styles.timeTextButton}
          >
            <Text style={styles.timePillText}>{time}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onRemoveTime(time)}
            style={styles.removeTimeButton}
          >
            <X size={16} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity
        style={styles.addTimeButton}
        onPress={onAddTime}
      >
        <Plus size={24} color={Colors.text.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  timeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  timePillWithRemove: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent.main,
    borderRadius: 20,
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.sm,
    paddingVertical: Spacing.sm + 4,
    gap: Spacing.sm,
  },
  timeTextButton: {
    // Makes the time text tappable
  },
  timePillText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.medium,
  },
  removeTimeButton: {
    padding: 2,
  },
  addTimeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

