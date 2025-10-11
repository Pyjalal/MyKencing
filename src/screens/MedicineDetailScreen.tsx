import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../constants/theme';

export default function MedicineDetailScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Medicine Details</Text>
      {/* TODO: Display medication details, MIMS guidance, adherence history */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    padding: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
});
