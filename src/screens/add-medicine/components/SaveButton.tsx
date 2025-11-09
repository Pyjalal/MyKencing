import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles';
import { Colors } from '../../../constants/theme';

interface SaveButtonProps {
  isSaving: boolean;
  onPress: () => void;
}

export const SaveButton: React.FC<SaveButtonProps> = ({ isSaving, onPress }) => (
  <TouchableOpacity
    style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
    onPress={onPress}
    disabled={isSaving}
  >
    {isSaving ? (
      <ActivityIndicator color={Colors.text.primary} />
    ) : (
      <Text style={styles.saveButtonText}>Add Medication</Text>
    )}
  </TouchableOpacity>
);

