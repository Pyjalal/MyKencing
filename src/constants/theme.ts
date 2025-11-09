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
  // Primary palette (Blue - trust, healthcare, MyKencing brand)
  primary: {
    50: '#EFF1FE',
    100: '#8FA2B9',
    200: '#377AB1',
    300: '#2C3442',
    400: '#194568',
    500: '#377AB1',
    600: '#2C3442',
    700: '#194568',
    800: '#194568',
    900: '#194568',
    main: '#377AB1',
    light: '#8FA2B9',
    dark: '#194568',
    contrast: '#FFFFFF',
  },

  // Secondary palette (Coral/Red - vitals, health indicators)
  secondary: {
    50: '#EFF1FE',
    100: '#E66A6A',
    200: '#E66A6A',
    300: '#E66A6A',
    400: '#E66A6A',
    500: '#E66A6A',
    600: '#E66A6A',
    700: '#E66A6A',
    800: '#E66A6A',
    900: '#E66A6A',
    main: '#E66A6A',
    light: '#EFF1FE',
    dark: '#2C3442',
    contrast: '#FFFFFF',
  },

  // Accent palette (Yellow/Gold - medications, positive actions)
  accent: {
    main: '#F8D849',
    light: '#FEF278',
    dark: '#2C3442',
    contrast: '#2C3442',
  },

  // Neutral palette (Enhanced grays with extended scale)
  neutral: {
    50: '#FFFFFF',
    100: '#EFF1FE',
    200: '#8FA2B9',
    300: '#5A6D8A',
    400: '#2C3442',
    500: '#194568',
    600: '#194568',
    700: '#2C3442',
    800: '#5A6D8A',
    900: '#8FA2B9',
  },

  // Background (Light lavender/purple tint from Figma)
  background: {
    primary: '#EFF1FE',
    secondary: '#FFFFFF',
    tertiary: '#8FA2B9',
    card: '#FFFFFF',
    elevated: '#FFFFFF',
    vitals: '#E66A6A',
    meds: '#F8D849',
    profile: '#377AB1',
  },

  // Text (WCAG AA compliant contrast ratios)
  text: {
    primary: '#2C3442',
    secondary: '#5A6D8A',
    tertiary: '#8FA2B9',
    disabled: '#8FA2B9',
    inverse: '#FFFFFF',
    link: '#377AB1',
  },

  // Status colors (calm, reassuring)
  status: {
    success: '#7ED957',
    successLight: '#EFF1FE',
    successDark: '#58A67C',

    warning: '#F8D849',
    warningLight: '#FEF278',
    warningDark: '#2C3442',

    error: '#E66A6A',
    errorLight: '#EFF1FE',
    errorDark: '#2C3442',

    info: '#377AB1',
    infoLight: '#8FA2B9',
    infoDark: '#194568',
  },

  // Dose status (specific to medication adherence)
  dose: {
    taken: '#7ED957',
    takenLight: '#EFF1FE',

    pending: '#377AB1',
    pendingLight: '#8FA2B9',

    upcoming: '#8FA2B9',
    upcomingLight: '#EFF1FE',

    late: '#F8D849',
    lateLight: '#FEF278',

    missed: '#E66A6A',
    missedLight: '#EFF1FE',

    skipped: '#5A6D8A',
    skippedLight: '#EFF1FE',
  },

  // Vitals status
  vitals: {
    normal: '#7ED957',
    normalLight: '#EFF1FE',

    warning: '#F8D849',
    warningLight: '#FEF278',

    critical: '#E66A6A',
    criticalLight: '#EFF1FE',

    unknown: '#8FA2B9',
    unknownLight: '#EFF1FE',
  },

  // Borders
  border: {
    light: '#EFF1FE',
    main: '#8FA2B9',
    dark: '#5A6D8A',
    focus: '#377AB1',
  },

  // Overlays and shadows
  overlay: 'rgba(44, 52, 66, 0.55)',
  overlayLight: 'rgba(44, 52, 66, 0.35)',
  shadow: 'rgba(25, 69, 104, 0.15)',

  // Ramadan mode accent
  ramadan: {
    main: '#58A67C',
    light: '#7ED957',
    background: '#EFF1FE',
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
