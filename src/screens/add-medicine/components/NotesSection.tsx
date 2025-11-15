import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { styles } from '../styles';
import { Colors } from '../../../constants/theme';

interface NotesSectionProps {
  notes: string;
  onChange: (value: string) => void;
}

export const NotesSection: React.FC<NotesSectionProps> = ({ notes, onChange }) => {
  const { t } = useTranslation();
  return (
    <View style={styles.section}>
      <Text style={styles.label}>{t('add_medicine.notes')}</Text>
      <TextInput
        style={styles.notesInput}
        placeholder={t('add_medicine.insert_notes')}
        placeholderTextColor={Colors.text.tertiary}
        value={notes}
        onChangeText={onChange}
        multiline
        numberOfLines={4}
      />
    </View>
  );
};

