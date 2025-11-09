import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { styles } from '../styles';
import { Colors } from '../../../constants/theme';

interface NotesSectionProps {
  notes: string;
  onChange: (value: string) => void;
}

export const NotesSection: React.FC<NotesSectionProps> = ({ notes, onChange }) => (
  <View style={styles.section}>
    <Text style={styles.label}>Notes</Text>
    <TextInput
      style={styles.notesInput}
      placeholder="Insert notes"
      placeholderTextColor={Colors.text.tertiary}
      value={notes}
      onChangeText={onChange}
      multiline
      numberOfLines={4}
    />
  </View>
);

