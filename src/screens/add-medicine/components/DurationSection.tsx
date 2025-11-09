import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
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
}) => (
  <View style={styles.section}>
    <Text style={styles.label}>Duration</Text>
    <View style={styles.rowSection}>
      <TouchableOpacity style={[styles.input, styles.flexInput, styles.dateInput]} onPress={onStartPress}>
        <Text style={styles.dateText}>{startDate.toLocaleDateString()}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.input, styles.flexInput, styles.dateInput]} onPress={onEndPress}>
        <Text style={[styles.dateText, !endDate && styles.placeholderText]}>
          {endDate ? endDate.toLocaleDateString() : 'End date'}
        </Text>
      </TouchableOpacity>
    </View>
  </View>
);

