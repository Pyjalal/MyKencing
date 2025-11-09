import { StyleSheet } from 'react-native';
import { BorderRadius, Colors, Spacing, Typography } from '../../constants/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D5D7E3',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingTop: Spacing['2xl'],
    paddingBottom: 100,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  rowSection: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.card,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 4,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  flexInput: {
    flex: 1,
  },
  dateInput: {
    justifyContent: 'center',
  },
  dateText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.card,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 4,
    minWidth: 120,
  },
  dropdownButtonText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    marginRight: Spacing.sm,
  },
  dropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.card,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 4,
  },
  dropdownInputText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    flex: 1,
  },
  placeholderText: {
    color: Colors.text.tertiary,
  },
  timeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  timePill: {
    backgroundColor: Colors.background.card,
    borderRadius: 20,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 4,
  },
  timePillSelected: {
    backgroundColor: Colors.accent.main,
  },
  timePillText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.medium,
  },
  timePillTextSelected: {
    color: Colors.text.primary,
  },
  addTimeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTimeButtonText: {
    fontSize: 24,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.bold,
  },
  notesInput: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.card,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: Colors.accent.main,
    borderRadius: BorderRadius.card,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.card,
    padding: Spacing.xl,
    width: '80%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  modalScroll: {
    maxHeight: 300,
  },
  modalOption: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  modalOptionText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  dateButton: {
    backgroundColor: Colors.accent.main,
    borderRadius: BorderRadius.button,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  dateButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border.main,
  },
  dateButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  dateButtonTextSecondary: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.secondary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.card,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 4,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  clearButton: {
    marginLeft: Spacing.sm,
    padding: Spacing.xs,
  },
  searchingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  searchingText: {
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
  },
  searchResultsInline: {
    marginTop: Spacing.sm,
    height: 300,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  searchResultsList: {
    flex: 1,
  },
  searchResultItem: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  searchResultContent: {
    padding: Spacing.lg,
  },
  searchResultName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  searchResultDetails: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  selectedMedicineContainer: {
    backgroundColor: Colors.accent.light,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    marginTop: Spacing.sm,
  },
  selectedMedicineLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.accent.main,
    marginBottom: Spacing.xs,
  },
  selectedMedicineName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  selectedMedicineDetails: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
});

