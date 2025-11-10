import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { Colors } from '../../../constants/theme';
import { styles } from '../styles';

interface DosageUnitRowProps {
  dosage: string;
  unit: string;
  onDosageChange: (value: string) => void;
  onUnitPress: () => void;
}

export const DosageUnitRow: React.FC<DosageUnitRowProps> = ({
  dosage,
  unit,
  onDosageChange,
  onUnitPress,
}) => (
  <View style={styles.rowSection}>
    <TextInput
      style={[styles.input, styles.flexInput]}
      placeholder="Insert dosage"
      placeholderTextColor={Colors.text.tertiary}
      value={dosage}
      onChangeText={onDosageChange}
      keyboardType="numeric"
    />
    <TouchableOpacity style={styles.dropdownButton} onPress={onUnitPress}>
      <Text style={styles.dropdownButtonText}>{unit || 'Unit'}</Text>
      <ChevronDown size={20} color={Colors.accent.main} />
    </TouchableOpacity>
  </View>
);

