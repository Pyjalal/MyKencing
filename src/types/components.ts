// ============================================================================
// Component Type Definitions for MyKencing React Native Application
// ============================================================================
// This file contains TypeScript type definitions for 15 reusable UI components
// organized by priority (High > Medium > Low). All components are designed with
// elderly-friendly accessibility features and follow WCAG AA standards.
//
// Design Principles:
// - Large touch targets (minimum 56px)
// - High contrast colors (4.5:1 ratio minimum)
// - Clear, readable typography (18px base size)
// - Accessible labels and screen reader support
// ============================================================================

import type { ReactNode } from 'react';
import type {
  ViewStyle,
  TextStyle,
  ImageStyle,
  StyleProp,
  TextInputProps,
  AccessibilityProps,
  GestureResponderEvent,
} from 'react-native';

// ============================================================================
// COMMON SHARED TYPES
// ============================================================================

/**
 * Button variant types used across multiple components
 */
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

/**
 * Button size types for different contexts
 */
export type ButtonSize = 'small' | 'medium' | 'large';

/**
 * Common button configuration used in action pairs and other multi-button components
 */
export interface ButtonConfig {
  /** Button label text */
  label: string;
  /** Button press handler */
  onPress: () => void;
  /** Visual style variant */
  variant?: ButtonVariant;
  /** Whether button is disabled */
  disabled?: boolean;
  /** Show loading spinner */
  loading?: boolean;
  /** Icon to display (left side) */
  icon?: ReactNode;
  /** Icon to display (right side) */
  iconRight?: ReactNode;
  /** Accessible label for screen readers */
  accessibilityLabel?: string;
  /** Test ID for automated testing */
  testID?: string;
}

/**
 * Alignment options for flex layouts
 */
export type AlignmentType = 'left' | 'center' | 'right' | 'space-between' | 'space-around';

/**
 * Size variants for UI elements
 */
export type SizeVariant = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Color theme variants
 */
export type ColorVariant = 'primary' | 'secondary' | 'accent' | 'neutral' | 'success' | 'warning' | 'error' | 'info';

/**
 * Animation duration types
 */
export type AnimationDuration = 'instant' | 'fast' | 'normal' | 'slow';

// ============================================================================
// HIGH PRIORITY COMPONENTS
// ============================================================================

/**
 * ScreenHeader Component Props
 *
 * A colored header component with optional back button, search functionality,
 * and custom title. Used as the primary navigation header across screens.
 *
 * @example
 * ```tsx
 * <ScreenHeader
 *   title="Medications"
 *   backgroundColor={Colors.primary.main}
 *   showBackButton={true}
 *   onBackPress={() => navigation.goBack()}
 *   showSearch={true}
 *   onSearchPress={() => setSearchVisible(true)}
 * />
 * ```
 */
export interface ScreenHeaderProps extends AccessibilityProps {
  /** Header title text */
  title?: string;
  /** Background color of the header */
  backgroundColor: string;
  /** Show back button on left side */
  showBackButton?: boolean;
  /** Show search icon on right side */
  showSearch?: boolean;
  /** Back button press handler */
  onBackPress?: () => void;
  /** Search button press handler */
  onSearchPress?: () => void;
  /** Custom content to render on right side */
  rightAction?: ReactNode;
  /** Custom content to render on left side (overrides back button) */
  leftAction?: ReactNode;
  /** Additional header content below title */
  subtitle?: string;
  /** Container style overrides */
  containerStyle?: StyleProp<ViewStyle>;
  /** Title text style overrides */
  titleStyle?: StyleProp<TextStyle>;
  /** Subtitle text style overrides */
  subtitleStyle?: StyleProp<TextStyle>;
  /** Accessibility label for back button */
  backButtonLabel?: string;
  /** Accessibility label for search button */
  searchButtonLabel?: string;
  /** Header height (default: 120px from theme) */
  height?: number;
  /** Enable shadow/elevation */
  elevated?: boolean;
  /** Test ID for automated testing */
  testID?: string;
}

/**
 * SearchBar Component Props
 *
 * A unified search input component with optional voice search, clear button,
 * and filter functionality. Designed for elderly users with large touch targets.
 *
 * @example
 * ```tsx
 * <SearchBar
 *   placeholder="Search medications..."
 *   value={searchQuery}
 *   onChangeText={setSearchQuery}
 *   onSearch={handleSearch}
 *   showVoiceSearch={true}
 *   autoFocus={false}
 * />
 * ```
 */
export interface SearchBarProps extends Omit<TextInputProps, 'style'> {
  /** Current search text value */
  value: string;
  /** Text change handler */
  onChangeText: (text: string) => void;
  /** Search submit handler (Enter key or search button) */
  onSearch?: (text: string) => void;
  /** Clear button press handler */
  onClear?: () => void;
  /** Voice search button press handler */
  onVoiceSearch?: () => void;
  /** Filter button press handler */
  onFilterPress?: () => void;
  /** Search input placeholder */
  placeholder?: string;
  /** Show voice search button */
  showVoiceSearch?: boolean;
  /** Show filter button */
  showFilter?: boolean;
  /** Show loading indicator */
  loading?: boolean;
  /** Container style overrides */
  containerStyle?: StyleProp<ViewStyle>;
  /** Input style overrides */
  inputStyle?: StyleProp<TextStyle>;
  /** Icon color */
  iconColor?: string;
  /** Auto-focus on mount */
  autoFocus?: boolean;
  /** Accessibility label for clear button */
  clearButtonLabel?: string;
  /** Accessibility label for voice search button */
  voiceSearchLabel?: string;
  /** Accessibility label for filter button */
  filterButtonLabel?: string;
  /** Test ID for automated testing */
  testID?: string;
}

/**
 * ActionButtonPair Component Props
 *
 * Side-by-side action buttons for primary/secondary actions. Commonly used
 * for confirm/cancel, save/discard, or other paired actions.
 *
 * @example
 * ```tsx
 * <ActionButtonPair
 *   primaryButton={{
 *     label: "Take Dose",
 *     onPress: handleTakeDose,
 *     variant: 'primary',
 *   }}
 *   secondaryButton={{
 *     label: "Skip",
 *     onPress: handleSkipDose,
 *     variant: 'outline',
 *   }}
 *   layout="horizontal"
 * />
 * ```
 */
export interface ActionButtonPairProps extends AccessibilityProps {
  /** Primary action button configuration */
  primaryButton: ButtonConfig;
  /** Secondary action button configuration */
  secondaryButton: ButtonConfig;
  /** Layout direction */
  layout?: 'horizontal' | 'vertical';
  /** Button size variant */
  size?: ButtonSize;
  /** Space between buttons */
  spacing?: number;
  /** Full width buttons */
  fullWidth?: boolean;
  /** Container style overrides */
  containerStyle?: StyleProp<ViewStyle>;
  /** Primary button style overrides */
  primaryButtonStyle?: StyleProp<ViewStyle>;
  /** Secondary button style overrides */
  secondaryButtonStyle?: StyleProp<ViewStyle>;
  /** Reverse button order (secondary on left/top) */
  reversed?: boolean;
  /** Test ID for automated testing */
  testID?: string;
}

/**
 * EmptyState Component Props
 *
 * Placeholder component shown when there is no data to display. Includes
 * optional icon, title, message, and call-to-action button.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon="📋"
 *   title="No Medications"
 *   message="You haven't added any medications yet. Tap the button below to get started."
 *   actionButton={{
 *     label: "Add Medication",
 *     onPress: () => navigation.navigate('AddMedicine'),
 *     variant: 'primary',
 *   }}
 * />
 * ```
 */
export interface EmptyStateProps extends AccessibilityProps {
  /** Icon or image to display */
  icon?: ReactNode;
  /** Main title text */
  title: string;
  /** Descriptive message text */
  message?: string;
  /** Call-to-action button */
  actionButton?: ButtonConfig;
  /** Secondary action button */
  secondaryButton?: ButtonConfig;
  /** Container style overrides */
  containerStyle?: StyleProp<ViewStyle>;
  /** Title text style overrides */
  titleStyle?: StyleProp<TextStyle>;
  /** Message text style overrides */
  messageStyle?: StyleProp<TextStyle>;
  /** Icon container style overrides */
  iconContainerStyle?: StyleProp<ViewStyle>;
  /** Vertical alignment */
  verticalAlignment?: 'top' | 'center' | 'bottom';
  /** Test ID for automated testing */
  testID?: string;
}

// ============================================================================
// MEDIUM PRIORITY COMPONENTS
// ============================================================================

/**
 * InputCard Component Props
 *
 * Large, touch-friendly input component with label, optional units, and
 * validation support. Optimized for elderly users with vision impairments.
 *
 * @example
 * ```tsx
 * <InputCard
 *   label="Blood Glucose"
 *   value={glucoseValue}
 *   onChangeText={setGlucoseValue}
 *   unit="mmol/L"
 *   keyboardType="decimal-pad"
 *   error={validationError}
 *   required={true}
 * />
 * ```
 */
export interface InputCardProps extends Omit<TextInputProps, 'style'> {
  /** Input label text */
  label: string;
  /** Current input value */
  value: string;
  /** Text change handler */
  onChangeText: (text: string) => void;
  /** Unit text (displayed on right side) */
  unit?: string;
  /** Helper text below input */
  helperText?: string;
  /** Error message (shows in error state) */
  error?: string;
  /** Success message (shows in success state) */
  success?: string;
  /** Required field indicator */
  required?: boolean;
  /** Input is disabled */
  disabled?: boolean;
  /** Left side icon */
  leftIcon?: ReactNode;
  /** Right side icon */
  rightIcon?: ReactNode;
  /** Container style overrides */
  containerStyle?: StyleProp<ViewStyle>;
  /** Label style overrides */
  labelStyle?: StyleProp<TextStyle>;
  /** Input style overrides */
  inputStyle?: StyleProp<TextStyle>;
  /** Card elevation/shadow */
  elevated?: boolean;
  /** Multiline input */
  multiline?: boolean;
  /** Number of lines for multiline */
  numberOfLines?: number;
  /** Input validation state */
  validationState?: 'default' | 'error' | 'success' | 'warning';
  /** Test ID for automated testing */
  testID?: string;
}

/**
 * ProgressBar Component Props
 *
 * Horizontal progress indicator showing completion percentage. Used for
 * medication adherence, goal tracking, and other progress metrics.
 *
 * @example
 * ```tsx
 * <ProgressBar
 *   progress={75}
 *   total={100}
 *   color={Colors.status.success}
 *   showLabel={true}
 *   label="75% adherence"
 *   height={12}
 * />
 * ```
 */
export interface ProgressBarProps extends AccessibilityProps {
  /** Current progress value */
  progress: number;
  /** Total/maximum value */
  total?: number;
  /** Progress bar color */
  color?: string;
  /** Background color */
  backgroundColor?: string;
  /** Show percentage label */
  showLabel?: boolean;
  /** Custom label text (overrides percentage) */
  label?: string;
  /** Bar height in pixels */
  height?: number;
  /** Border radius */
  borderRadius?: number;
  /** Container style overrides */
  containerStyle?: StyleProp<ViewStyle>;
  /** Bar style overrides */
  barStyle?: StyleProp<ViewStyle>;
  /** Label style overrides */
  labelStyle?: StyleProp<TextStyle>;
  /** Animated transition */
  animated?: boolean;
  /** Animation duration in ms */
  animationDuration?: number;
  /** Striped pattern */
  striped?: boolean;
  /** Test ID for automated testing */
  testID?: string;
}

/**
 * BottomSheet Component Props
 *
 * Modal selection UI that slides up from the bottom. Used for pickers,
 * selection lists, and action sheets.
 *
 * @example
 * ```tsx
 * <BottomSheet
 *   visible={isVisible}
 *   onClose={() => setIsVisible(false)}
 *   title="Select Time"
 *   snapPoints={['50%', '90%']}
 * >
 *   <TimePickerContent />
 * </BottomSheet>
 * ```
 */
export interface BottomSheetProps extends AccessibilityProps {
  /** Sheet visibility */
  visible: boolean;
  /** Close handler */
  onClose: () => void;
  /** Sheet title */
  title?: string;
  /** Sheet content */
  children: ReactNode;
  /** Snap points (percentages or pixel values) */
  snapPoints?: (string | number)[];
  /** Initial snap point index */
  initialSnapIndex?: number;
  /** Enable backdrop press to close */
  enableBackdropDismiss?: boolean;
  /** Enable swipe down to close */
  enableSwipeDismiss?: boolean;
  /** Show close button */
  showCloseButton?: boolean;
  /** Show handle/grabber */
  showHandle?: boolean;
  /** Container style overrides */
  containerStyle?: StyleProp<ViewStyle>;
  /** Header style overrides */
  headerStyle?: StyleProp<ViewStyle>;
  /** Content style overrides */
  contentStyle?: StyleProp<ViewStyle>;
  /** Backdrop opacity (0-1) */
  backdropOpacity?: number;
  /** Animation duration */
  animationDuration?: AnimationDuration;
  /** Callback when sheet reaches snap point */
  onSnapPointChange?: (index: number) => void;
  /** Test ID for automated testing */
  testID?: string;
}

/**
 * WeekCalendar Component Props
 *
 * 7-day calendar selector for viewing and selecting dates within a week.
 * Used for medication history, vitals tracking, and date-based navigation.
 *
 * @example
 * ```tsx
 * <WeekCalendar
 *   selectedDate={new Date()}
 *   onDateSelect={(date) => setSelectedDate(date)}
 *   markedDates={{
 *     '2024-01-15': { marked: true, dotColor: 'green' },
 *     '2024-01-16': { marked: true, dotColor: 'red' },
 *   }}
 * />
 * ```
 */
export interface WeekCalendarProps extends AccessibilityProps {
  /** Currently selected date */
  selectedDate: Date;
  /** Date selection handler */
  onDateSelect: (date: Date) => void;
  /** Initial week start date (defaults to current week) */
  initialDate?: Date;
  /** Dates with markers/dots */
  markedDates?: Record<string, MarkedDateConfig>;
  /** Minimum selectable date */
  minDate?: Date;
  /** Maximum selectable date */
  maxDate?: Date;
  /** First day of week (0 = Sunday, 1 = Monday) */
  firstDayOfWeek?: 0 | 1;
  /** Show week navigation arrows */
  showNavigation?: boolean;
  /** Week change handler */
  onWeekChange?: (startDate: Date, endDate: Date) => void;
  /** Container style overrides */
  containerStyle?: StyleProp<ViewStyle>;
  /** Day cell style overrides */
  dayStyle?: StyleProp<ViewStyle>;
  /** Selected day style overrides */
  selectedDayStyle?: StyleProp<ViewStyle>;
  /** Day text style overrides */
  dayTextStyle?: StyleProp<TextStyle>;
  /** Show month/year header */
  showHeader?: boolean;
  /** Header text style */
  headerStyle?: StyleProp<TextStyle>;
  /** Test ID for automated testing */
  testID?: string;
}

/**
 * Configuration for marked dates in calendar
 */
export interface MarkedDateConfig {
  /** Show marker dot */
  marked?: boolean;
  /** Marker dot color */
  dotColor?: string;
  /** Multiple dots */
  dots?: Array<{ color: string; key: string }>;
  /** Disable date selection */
  disabled?: boolean;
  /** Custom background color */
  backgroundColor?: string;
  /** Custom text color */
  textColor?: string;
}

// ============================================================================
// LOWER PRIORITY COMPONENTS
// ============================================================================

/**
 * LoadingOverlay Component Props
 *
 * Full-screen loading state with spinner and optional message. Blocks
 * user interaction while data is loading.
 *
 * @example
 * ```tsx
 * <LoadingOverlay
 *   visible={isLoading}
 *   message="Loading medications..."
 *   spinner="large"
 * />
 * ```
 */
export interface LoadingOverlayProps extends AccessibilityProps {
  /** Overlay visibility */
  visible: boolean;
  /** Loading message text */
  message?: string;
  /** Spinner size */
  spinner?: 'small' | 'large';
  /** Overlay background color */
  backgroundColor?: string;
  /** Overlay opacity (0-1) */
  opacity?: number;
  /** Text color */
  textColor?: string;
  /** Container style overrides */
  containerStyle?: StyleProp<ViewStyle>;
  /** Message style overrides */
  messageStyle?: StyleProp<TextStyle>;
  /** Custom spinner component */
  spinnerComponent?: ReactNode;
  /** Test ID for automated testing */
  testID?: string;
}

/**
 * FloatingActionButton Component Props
 *
 * Circular floating action button, typically positioned in bottom-right corner.
 * Used for primary actions like "Add" or "Create".
 *
 * @example
 * ```tsx
 * <FloatingActionButton
 *   icon={<PlusIcon />}
 *   onPress={() => navigation.navigate('AddMedicine')}
 *   backgroundColor={Colors.primary.main}
 *   position="bottom-right"
 * />
 * ```
 */
export interface FloatingActionButtonProps extends AccessibilityProps {
  /** Button press handler */
  onPress: () => void;
  /** Icon to display */
  icon: ReactNode;
  /** Button background color */
  backgroundColor?: string;
  /** Icon color */
  iconColor?: string;
  /** Button size */
  size?: 'small' | 'medium' | 'large';
  /** Position on screen */
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center' | 'top-right' | 'top-left';
  /** Distance from edges */
  offset?: { x?: number; y?: number };
  /** Show shadow/elevation */
  elevated?: boolean;
  /** Container style overrides */
  containerStyle?: StyleProp<ViewStyle>;
  /** Button style overrides */
  buttonStyle?: StyleProp<ViewStyle>;
  /** Extended FAB with label */
  label?: string;
  /** Label style overrides */
  labelStyle?: StyleProp<TextStyle>;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Test ID for automated testing */
  testID?: string;
}

/**
 * SettingsRow Component Props
 *
 * Row item for settings lists with label, value, icon, and optional toggle
 * or chevron. Used in Settings screen and preference lists.
 *
 * @example
 * ```tsx
 * <SettingsRow
 *   icon={<BellIcon />}
 *   label="Notifications"
 *   value="Enabled"
 *   showChevron={true}
 *   onPress={() => navigation.navigate('NotificationSettings')}
 * />
 * ```
 */
export interface SettingsRowProps extends AccessibilityProps {
  /** Row label text */
  label: string;
  /** Current value text */
  value?: string;
  /** Left side icon */
  icon?: ReactNode;
  /** Row press handler */
  onPress?: () => void;
  /** Show right chevron */
  showChevron?: boolean;
  /** Show toggle switch */
  showToggle?: boolean;
  /** Toggle value (if showToggle is true) */
  toggleValue?: boolean;
  /** Toggle change handler */
  onToggleChange?: (value: boolean) => void;
  /** Right side custom content */
  rightContent?: ReactNode;
  /** Row is disabled */
  disabled?: boolean;
  /** Container style overrides */
  containerStyle?: StyleProp<ViewStyle>;
  /** Label style overrides */
  labelStyle?: StyleProp<TextStyle>;
  /** Value style overrides */
  valueStyle?: StyleProp<TextStyle>;
  /** Show divider below row */
  showDivider?: boolean;
  /** First item in list (no top border) */
  first?: boolean;
  /** Last item in list (no bottom border) */
  last?: boolean;
  /** Test ID for automated testing */
  testID?: string;
}

/**
 * SectionCard Component Props
 *
 * Card container with optional title header and collapsible content.
 * Used for grouping related content sections.
 *
 * @example
 * ```tsx
 * <SectionCard
 *   title="Today's Medications"
 *   subtitle="3 doses remaining"
 *   collapsible={true}
 *   defaultExpanded={true}
 * >
 *   <DoseList />
 * </SectionCard>
 * ```
 */
export interface SectionCardProps extends AccessibilityProps {
  /** Section title */
  title?: string;
  /** Section subtitle */
  subtitle?: string;
  /** Card content */
  children: ReactNode;
  /** Left side icon */
  icon?: ReactNode;
  /** Right side action button */
  rightAction?: ReactNode;
  /** Card is collapsible */
  collapsible?: boolean;
  /** Default expanded state */
  defaultExpanded?: boolean;
  /** Controlled expanded state */
  expanded?: boolean;
  /** Expand/collapse handler */
  onToggleExpand?: (expanded: boolean) => void;
  /** Show card shadow */
  elevated?: boolean;
  /** Container style overrides */
  containerStyle?: StyleProp<ViewStyle>;
  /** Header style overrides */
  headerStyle?: StyleProp<ViewStyle>;
  /** Content style overrides */
  contentStyle?: StyleProp<ViewStyle>;
  /** Title text style overrides */
  titleStyle?: StyleProp<TextStyle>;
  /** Subtitle text style overrides */
  subtitleStyle?: StyleProp<TextStyle>;
  /** Disable padding on content */
  noPadding?: boolean;
  /** Test ID for automated testing */
  testID?: string;
}

/**
 * TimeSlotPicker Component Props
 *
 * Time selection component for medication scheduling. Allows picking
 * multiple time slots for different medication frequencies.
 *
 * @example
 * ```tsx
 * <TimeSlotPicker
 *   selectedTimes={['08:00', '20:00']}
 *   onTimesChange={(times) => setMedicationTimes(times)}
 *   maxSlots={4}
 *   presets={['Once Daily', 'Twice Daily', 'Three Times Daily']}
 * />
 * ```
 */
export interface TimeSlotPickerProps extends AccessibilityProps {
  /** Currently selected times (HH:mm format) */
  selectedTimes: string[];
  /** Times change handler */
  onTimesChange: (times: string[]) => void;
  /** Maximum number of time slots */
  maxSlots?: number;
  /** Minimum number of time slots */
  minSlots?: number;
  /** Preset time configurations */
  presets?: TimeSlotPreset[];
  /** Custom time slot suggestions */
  suggestions?: string[];
  /** Allow custom time entry */
  allowCustomTime?: boolean;
  /** 12-hour or 24-hour format */
  timeFormat?: '12h' | '24h';
  /** Container style overrides */
  containerStyle?: StyleProp<ViewStyle>;
  /** Time slot style overrides */
  timeSlotStyle?: StyleProp<ViewStyle>;
  /** Show add time button */
  showAddButton?: boolean;
  /** Add button label */
  addButtonLabel?: string;
  /** Show remove buttons on time slots */
  showRemoveButtons?: boolean;
  /** Test ID for automated testing */
  testID?: string;
}

/**
 * Preset time slot configuration
 */
export interface TimeSlotPreset {
  /** Preset name/label */
  label: string;
  /** Preset time slots */
  times: string[];
  /** Preset description */
  description?: string;
}

/**
 * ChartCard Component Props
 *
 * Card component for displaying vitals charts and trends. Wraps chart
 * components with consistent styling and legend.
 *
 * @example
 * ```tsx
 * <ChartCard
 *   title="Blood Glucose Trend"
 *   period="Last 7 Days"
 *   chart={<LineChart data={glucoseData} />}
 *   legend={[
 *     { label: 'Normal Range', color: Colors.status.success },
 *     { label: 'Warning', color: Colors.status.warning },
 *   ]}
 * />
 * ```
 */
export interface ChartCardProps extends AccessibilityProps {
  /** Chart title */
  title: string;
  /** Time period label */
  period?: string;
  /** Chart component */
  chart: ReactNode;
  /** Chart legend items */
  legend?: ChartLegendItem[];
  /** Summary statistics */
  stats?: ChartStat[];
  /** Period selector options */
  periodOptions?: string[];
  /** Selected period index */
  selectedPeriod?: number;
  /** Period change handler */
  onPeriodChange?: (index: number) => void;
  /** Export chart button */
  showExport?: boolean;
  /** Export handler */
  onExport?: () => void;
  /** Container style overrides */
  containerStyle?: StyleProp<ViewStyle>;
  /** Header style overrides */
  headerStyle?: StyleProp<ViewStyle>;
  /** Chart container style overrides */
  chartStyle?: StyleProp<ViewStyle>;
  /** Show card shadow */
  elevated?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Empty state content */
  emptyState?: ReactNode;
  /** Test ID for automated testing */
  testID?: string;
}

/**
 * Chart legend item configuration
 */
export interface ChartLegendItem {
  /** Legend label */
  label: string;
  /** Legend color */
  color: string;
  /** Legend icon (optional) */
  icon?: ReactNode;
}

/**
 * Chart statistic configuration
 */
export interface ChartStat {
  /** Stat label */
  label: string;
  /** Stat value */
  value: string | number;
  /** Stat unit */
  unit?: string;
  /** Stat color */
  color?: string;
  /** Stat trend (up/down) */
  trend?: 'up' | 'down' | 'stable';
}

/**
 * InteractionCard Component Props
 *
 * Base component for displaying drug-drug and drug-food interactions.
 * Shows severity, affected medications, and detailed warnings.
 *
 * @example
 * ```tsx
 * <InteractionCard
 *   type="drug-drug"
 *   severity="high"
 *   medications={['Metformin', 'Aspirin']}
 *   warning="May increase risk of lactic acidosis"
 *   recommendation="Monitor blood glucose closely"
 *   onViewDetails={() => showInteractionDetails()}
 * />
 * ```
 */
export interface InteractionCardProps extends AccessibilityProps {
  /** Interaction type */
  type: 'drug-drug' | 'drug-food';
  /** Severity level */
  severity: 'low' | 'moderate' | 'high' | 'critical';
  /** Affected medications */
  medications: string[];
  /** Affected foods (for drug-food interactions) */
  foods?: string[];
  /** Warning message */
  warning: string;
  /** Recommendation text */
  recommendation?: string;
  /** Additional details */
  details?: string;
  /** View details handler */
  onViewDetails?: () => void;
  /** Dismiss/hide interaction */
  onDismiss?: () => void;
  /** Container style overrides */
  containerStyle?: StyleProp<ViewStyle>;
  /** Header style overrides */
  headerStyle?: StyleProp<ViewStyle>;
  /** Content style overrides */
  contentStyle?: StyleProp<ViewStyle>;
  /** Show dismiss button */
  showDismiss?: boolean;
  /** Collapsed state (show summary only) */
  collapsed?: boolean;
  /** Show expand/collapse button */
  showExpandButton?: boolean;
  /** Icon for interaction type */
  icon?: ReactNode;
  /** Test ID for automated testing */
  testID?: string;
}

// ============================================================================
// UTILITY TYPES FOR COMPONENT COMPOSITION
// ============================================================================

/**
 * Generic card container props for consistent card styling
 */
export interface CardContainerProps extends AccessibilityProps {
  /** Card content */
  children: ReactNode;
  /** Press handler (makes card touchable) */
  onPress?: (event: GestureResponderEvent) => void;
  /** Long press handler */
  onLongPress?: (event: GestureResponderEvent) => void;
  /** Container style overrides */
  style?: StyleProp<ViewStyle>;
  /** Show shadow/elevation */
  elevated?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Active/selected state */
  active?: boolean;
  /** Test ID for automated testing */
  testID?: string;
}

/**
 * Icon button props for consistent icon button styling
 */
export interface IconButtonProps extends AccessibilityProps {
  /** Icon to display */
  icon: ReactNode;
  /** Press handler */
  onPress: () => void;
  /** Button size */
  size?: 'small' | 'medium' | 'large';
  /** Icon color */
  color?: string;
  /** Background color */
  backgroundColor?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Container style overrides */
  style?: StyleProp<ViewStyle>;
  /** Show badge */
  badge?: number | boolean;
  /** Badge color */
  badgeColor?: string;
  /** Test ID for automated testing */
  testID?: string;
}

/**
 * Badge props for status indicators
 */
export interface BadgeProps extends AccessibilityProps {
  /** Badge text or count */
  value: string | number;
  /** Badge color variant */
  variant?: ColorVariant;
  /** Badge size */
  size?: 'small' | 'medium' | 'large';
  /** Custom background color */
  backgroundColor?: string;
  /** Custom text color */
  textColor?: string;
  /** Container style overrides */
  style?: StyleProp<ViewStyle>;
  /** Text style overrides */
  textStyle?: StyleProp<TextStyle>;
  /** Show dot only (no text) */
  dot?: boolean;
  /** Test ID for automated testing */
  testID?: string;
}

/**
 * Divider props for section separators
 */
export interface DividerProps {
  /** Divider color */
  color?: string;
  /** Divider thickness */
  thickness?: number;
  /** Divider orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Add spacing around divider */
  spacing?: number;
  /** Container style overrides */
  style?: StyleProp<ViewStyle>;
}

// ============================================================================
// COMPONENT COMPOSITION HELPERS
// ============================================================================

/**
 * List item props for consistent list item styling
 */
export interface ListItemProps extends AccessibilityProps {
  /** Item title */
  title: string;
  /** Item subtitle */
  subtitle?: string;
  /** Left side content */
  left?: ReactNode;
  /** Right side content */
  right?: ReactNode;
  /** Press handler */
  onPress?: () => void;
  /** Long press handler */
  onLongPress?: () => void;
  /** Item is disabled */
  disabled?: boolean;
  /** Item is selected */
  selected?: boolean;
  /** Show divider below item */
  showDivider?: boolean;
  /** Container style overrides */
  containerStyle?: StyleProp<ViewStyle>;
  /** Title style overrides */
  titleStyle?: StyleProp<TextStyle>;
  /** Subtitle style overrides */
  subtitleStyle?: StyleProp<TextStyle>;
  /** Test ID for automated testing */
  testID?: string;
}

/**
 * Avatar props for user/medication avatars
 */
export interface AvatarProps extends AccessibilityProps {
  /** Avatar source (URL or local) */
  source?: { uri: string } | number;
  /** Fallback text (initials) */
  fallbackText?: string;
  /** Avatar size */
  size?: number | 'small' | 'medium' | 'large';
  /** Avatar shape */
  shape?: 'circle' | 'square' | 'rounded';
  /** Background color (for fallback) */
  backgroundColor?: string;
  /** Text color (for fallback) */
  textColor?: string;
  /** Container style overrides */
  style?: StyleProp<ViewStyle>;
  /** Image style overrides */
  imageStyle?: StyleProp<ImageStyle>;
  /** Show badge indicator */
  badge?: boolean;
  /** Badge color */
  badgeColor?: string;
  /** Test ID for automated testing */
  testID?: string;
}

/**
 * Chip/Tag props for labels and filters
 */
export interface ChipProps extends AccessibilityProps {
  /** Chip label */
  label: string;
  /** Press handler */
  onPress?: () => void;
  /** Close/remove handler */
  onClose?: () => void;
  /** Chip variant */
  variant?: 'filled' | 'outlined' | 'tonal';
  /** Color variant */
  color?: ColorVariant;
  /** Left side icon */
  icon?: ReactNode;
  /** Chip size */
  size?: 'small' | 'medium' | 'large';
  /** Selected state */
  selected?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Container style overrides */
  style?: StyleProp<ViewStyle>;
  /** Label style overrides */
  labelStyle?: StyleProp<TextStyle>;
  /** Test ID for automated testing */
  testID?: string;
}

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

// Re-export common React Native types for convenience
export type {
  ViewStyle,
  TextStyle,
  ImageStyle,
  StyleProp,
  AccessibilityProps,
  GestureResponderEvent,
} from 'react-native';

export type { ReactNode } from 'react';
