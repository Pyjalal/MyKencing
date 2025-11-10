import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Search } from 'lucide-react-native';
import { Colors, Typography, Spacing } from '../constants/theme';

interface ScreenLayoutProps {
  backgroundColor: string;
  contentBackgroundColor?: string;
  title: string;
  searchPlaceholder?: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onBackPress?: () => void;
  headerSlot?: React.ReactNode;
  children: React.ReactNode;
}

export default function ScreenLayout({
  backgroundColor,
  contentBackgroundColor,
  title,
  searchPlaceholder = 'Search here',
  searchQuery = '',
  onSearchChange,
  onBackPress,
  headerSlot,
  children,
}: ScreenLayoutProps) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor }]}>
        {/* Back button and Title row */}
        <View style={styles.titleRow}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{title}</Text>
          </View>
        </View>

        {/* Search Bar */}
        {onSearchChange && (
          <View style={styles.searchContainer}>
            <Search size={20} color={Colors.text.tertiary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={searchPlaceholder}
              placeholderTextColor={Colors.text.tertiary}
              value={searchQuery}
              onChangeText={onSearchChange}
            />
          </View>
        )}

        {/* Header slot - for buttons/actions in header */}
        {headerSlot}
      </View>

      {/* Main content slot */}
      <View style={[styles.content, contentBackgroundColor && { backgroundColor: contentBackgroundColor }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Spacing['2xl'] + 10,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    position: 'relative',
    minHeight: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  backIcon: {
    fontSize: 28,
    color: Colors.text.inverse,
  },
  titleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.inverse,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    borderRadius: 25,
    paddingHorizontal: Spacing.md + 4,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
});

