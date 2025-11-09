import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { styles } from '../styles';
import { Colors } from '../../../constants/theme';

interface LabeledDropdownProps {
  label: string;
  valueLabel?: string;
  placeholder: string;
  onPress: () => void;
}

export const LabeledDropdown: React.FC<LabeledDropdownProps> = ({
  label,
  valueLabel,
  placeholder,
  onPress,
}) => (
  <View style={styles.section}>
    <Text style={styles.label}>{label}</Text>
    <TouchableOpacity style={styles.dropdownInput} onPress={onPress}>
      <Text
        style={[styles.dropdownInputText, !valueLabel && styles.placeholderText]}
        numberOfLines={1}
      >
        {valueLabel || placeholder}
      </Text>
      <ChevronDown size={20} color={Colors.accent.main} />
    </TouchableOpacity>
  </View>
);

