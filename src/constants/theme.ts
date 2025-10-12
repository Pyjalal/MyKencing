// ============================================================================
// Enhanced Theme Constants for MyKencing
// Design principles: Elderly-friendly, calm technology, Malaysian cultural sensitivity
// WCAG AA compliant, minimum 4.5:1 contrast ratios
// ============================================================================

/**
 * Enhanced Color Palette
 * - Primary: Soft teal (trust, healthcare) with extended scale
 * - Secondary: Warm coral (gentle alerts)
 * - Accent: Sunny yellow (gamification, positive reinforcement)
 * - Neutral: Extended gray scale
 * - Status: Calm, reassuring colors
 * - Ramadan: Purple accent for Islamic holidays
 */
export const Colors = {
  // Primary palette (Teal - trust, healthcare) with extended scale
  primary: {
    50: '#E0F2F2',
    100: '#B3E0E0',
    200: '#80CCCC',
    300: '#4DB8B8',
    400: '#26A9A9',
    500: '#2D9F9F', // Main
    600: '#268E8E',
    700: '#1E7A7A',
    800: '#166666',
    900: '#0D4545',
    main: '#2D9F9F',
    light: '#5DBFBF',
    dark: '#1E7A7A',
    contrast: '#FFFFFF',
  },

  // Secondary palette (Warm Coral - gentle alerts)
  secondary: {
    50: '#FFF3ED',
    100: '#FFE0D1',
    200: '#FFCCB3',
    300: '#FFB89F',
    400: '#FFA88B',
    500: '#FF9F7F', // Main
    600: '#E58F6F',
    700: '#CC7F5F',
    800: '#B26F4F',
    900: '#995F3F',
    main: '#FF9F7F',
    light: '#FFB89F',
    dark: '#E57F5F',
    contrast: '#000000',
  },

  // Accent palette (Sunny Yellow - positive reinforcement, gamification)
  accent: {
    main: '#F59E0B',
    light: '#FBBF24',
    dark: '#D97706',
    contrast: '#000000',
  },

  // Neutral palette (Enhanced grays with extended scale)
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },

  // Background
  background: {
    primary: '#FFFFFF',
    secondary: '#F5F5F5',
    tertiary: '#E8E8E8',
    card: '#FFFFFF',
    elevated: '#FFFFFF',
  },

  // Text (WCAG AA compliant contrast ratios)
  text: {
    primary: '#1A1A1A',      // 16:1 contrast on white
    secondary: '#4A4A4A',    // 8:1 contrast
    tertiary: '#757575',     // 4.5:1 contrast (minimum)
    disabled: '#ABABAB',     // 2.5:1 (non-essential only)
    inverse: '#FFFFFF',
    link: '#2D9F9F',
  },

  // Status colors (calm, reassuring)
  status: {
    success: '#4CAF50',
    successLight: '#E8F5E9',
    successDark: '#2E7D32',

    warning: '#FF9800',
    warningLight: '#FFF3E0',
    warningDark: '#E65100',

    error: '#E53935',
    errorLight: '#FFEBEE',
    errorDark: '#C62828',

    info: '#2196F3',
    infoLight: '#E3F2FD',
    infoDark: '#1565C0',
  },

  // Dose status (specific to medication adherence)
  dose: {
    taken: '#4CAF50',
    takenLight: '#E8F5E9',

    pending: '#2196F3',
    pendingLight: '#E3F2FD',

    upcoming: '#9E9E9E',
    upcomingLight: '#F5F5F5',

    late: '#FF9800',
    lateLight: '#FFF3E0',

    missed: '#E53935',
    missedLight: '#FFEBEE',

    skipped: '#757575',
    skippedLight: '#F5F5F5',
  },

  // Vitals status
  vitals: {
    normal: '#4CAF50',
    normalLight: '#E8F5E9',

    warning: '#FF9800',
    warningLight: '#FFF3E0',

    critical: '#E53935',
    criticalLight: '#FFEBEE',

    unknown: '#9E9E9E',
    unknownLight: '#F5F5F5',
  },

  // Borders
  border: {
    light: '#E0E0E0',
    main: '#BDBDBD',
    dark: '#9E9E9E',
    focus: '#2D9F9F',
  },

  // Overlays and shadows
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  shadow: 'rgba(0, 0, 0, 0.1)',

  // Ramadan mode accent
  ramadan: {
    main: '#8B4789',    // Purple
    light: '#B47AB2',
    background: '#F3E8F3',
  },
};

/**
 * Typography Scale (Elderly-Friendly)
 * Target: Readable, scalable, accessible (WCAG AA)
 * Base size increased to 18px for better readability
 */
export const Typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    // For multilingual support (EN/MS/ZH/TA), rely on system fonts
  },

  fontSize: {
    xs: 14,      // Labels, captions (increased from 12)
    sm: 16,      // Secondary text (increased from 14)
    base: 18,    // Body text (increased from 16) - elderly-friendly
    lg: 20,      // Emphasized text (increased from 18)
    xl: 24,      // Large headings (increased from 20)
    '2xl': 28,   // Screen titles (increased from 24)
    '3xl': 32,   // Hero text (increased from 28)
    '4xl': 40,   // Extra large (increased from 32)
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2.0,  // For elderly users with vision issues
  },

  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Predefined text styles for consistency
  styles: {
    h1: {
      fontSize: 32,
      fontWeight: '700' as const,
      lineHeight: 40,
      letterSpacing: -0.5,
    },
    h2: {
      fontSize: 28,
      fontWeight: '700' as const,
      lineHeight: 36,
      letterSpacing: -0.25,
    },
    h3: {
      fontSize: 24,
      fontWeight: '600' as const,
      lineHeight: 32,
    },
    h4: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 28,
    },
    body1: {
      fontSize: 18,
      fontWeight: '400' as const,
      lineHeight: 27,  // 1.5x
    },
    body2: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    caption: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
    button: {
      fontSize: 18,
      fontWeight: '600' as const,
      lineHeight: 24,
      letterSpacing: 0.5,
    },
  },
};

/**
 * Spacing System (8px Grid)
 */
export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,

  // Component-specific spacing
  cardPadding: 20,        // Generous card padding
  screenPadding: 20,      // Screen edge padding
  sectionSpacing: 24,     // Between sections
  itemSpacing: 12,        // Between list items
  iconTextGap: 12,        // Icon-to-text spacing
};

/**
 * Border Radius
 */
export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,

  // Component-specific
  button: 12,
  card: 16,
  input: 12,
  modal: 20,
  badge: 16,
};

/**
 * Shadows and Elevation
 */
export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 12,
  },
};

/**
 * Touch Targets (Elderly-Friendly)
 * Minimum 56px for WCAG AA compliance with elderly users
 */
export const TouchTargets = {
  min: 56,           // Minimum (WCAG AA elderly-friendly)
  recommended: 60,   // Recommended for primary actions
  large: 72,         // Extra large for critical actions
};

/**
 * Layout
 */
export const Layout = {
  containerPadding: Spacing.md,
  screenPadding: Spacing.cardPadding,
  cardPadding: Spacing.cardPadding,
  maxContentWidth: 600, // For tablets
  headerHeight: 120,    // Large header for elderly visibility
  tabBarHeight: 64,     // Larger than standard 56px for elderly
};

/**
 * Animation Timing (Gentle, Calm)
 */
export const Animation = {
  duration: {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 400,
    verySlow: 600,
  },
  easing: {
    standard: 'ease-in-out',
    decelerate: 'ease-out',
    accelerate: 'ease-in',
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
  },
};
