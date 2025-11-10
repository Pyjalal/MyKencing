// ============================================================================
// Enhanced Theme Constants for MyKencing
// Design principles: Elderly-friendly, calm technology, Malaysian cultural sensitivity
// WCAG AA compliant, minimum 4.5:1 contrast ratios
// ============================================================================

/**
 * Enhanced Color Palette - MyKencing Figma Design
 * - Primary: Blue tones (trust, healthcare, MyKencing brand)
 * - Secondary: Warm coral/red (vitals, alerts)
 * - Accent: Yellow/Gold (medications, actions)
 * - Neutral: Extended gray scale
 * - Status: Calm, reassuring colors
 * - Background: Light lavender/purple tint
 */
export const Colors = {
  navigatorColors: {
    "HomeTab": "#377AB1",
    "VitalsTab": "#E66A6A",
    "MedicationsTab": "#F0C400",
    "AddMedicine": "#F5B800",
    "ProfileTab": "#377AB1",
  },
  // Primary palette (Blue - trust, healthcare, MyKencing brand)
  primary: {
    50: '#E8F1F8',
    100: '#C5DDED',
    200: '#9FC7E1',
    300: '#79B1D5',
    400: '#5C9FCB',
    500: '#4A8FBD', // Main brand blue
    600: '#3D7AAC',
    700: '#2F6699',
    800: '#235186',
    900: '#1E4A6D', // Dark navy blue
    main: '#4A8FBD',
    light: '#79B1D5',
    dark: '#1E4A6D',
    contrast: '#FFFFFF',
  },

  // Secondary palette (Coral/Red - vitals, health indicators)
  secondary: {
    50: '#FFEBEE',
    100: '#FFCDD2',
    200: '#EF9A9A',
    300: '#E57373',
    400: '#EF5350',
    500: '#E57373', // Main coral
    600: '#E53935',
    700: '#D32F2F',
    800: '#C62828',
    900: '#B71C1C',
    main: '#E57373',
    light: '#FFCDD2',
    dark: '#D32F2F',
    contrast: '#FFFFFF',
  },

  // Accent palette (Yellow/Gold - medications, positive actions)
  accent: {
    main: '#F8D849',
    light: '#FFD54F',
    dark: '#F57F17',
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

  // Background (Light lavender/purple tint from Figma)
  background: {
    primary: '#EFF1FE', // Light lavender background
    secondary: '#F5F5F5',
    tertiary: '#E0E0E0',
    card: '#FFFFFF',
    elevated: '#FFFFFF',
    vitals: '#E57373', // Coral background for vitals
    meds: '#F0C400', // Yellow/gold background for meds
    profile: '#4A8FBD', // Blue background for profile
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
