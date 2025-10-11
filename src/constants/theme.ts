// ============================================================================
// Theme Constants for MyKencing
// Design principles: Calm technology, gentle colors, accessibility
// ============================================================================

/**
 * Color Palette
 * - Primary: Soft teal (trust, healthcare)
 * - Secondary: Warm coral (gentle alerts)
 * - Neutral: Grays for text and backgrounds
 * - Status: Gentle colors, avoid harsh red
 */
export const Colors = {
  // Primary palette
  primary: {
    main: '#2D9F9F', // Soft teal
    light: '#5DBFBF',
    dark: '#1E7A7A',
    contrast: '#FFFFFF',
  },

  // Secondary palette
  secondary: {
    main: '#FF9F7F', // Warm coral
    light: '#FFB89F',
    dark: '#E57F5F',
    contrast: '#000000',
  },

  // Background
  background: {
    primary: '#FFFFFF',
    secondary: '#F5F5F5',
    tertiary: '#E8E8E8',
    card: '#FFFFFF',
  },

  // Text
  text: {
    primary: '#1A1A1A',
    secondary: '#4A4A4A',
    tertiary: '#757575',
    disabled: '#ABABAB',
    inverse: '#FFFFFF',
  },

  // Status colors (calm, not alarming)
  status: {
    success: '#4CAF50',
    successLight: '#E8F5E9',
    warning: '#FF9800',
    warningLight: '#FFF3E0',
    error: '#E53935', // Only for critical issues
    errorLight: '#FFEBEE',
    info: '#2196F3',
    infoLight: '#E3F2FD',
  },

  // Dose status
  dose: {
    taken: '#4CAF50',
    takenLight: '#E8F5E9',
    pending: '#2196F3',
    pendingLight: '#E3F2FD',
    skipped: '#9E9E9E',
    skippedLight: '#F5F5F5',
    late: '#FF9800',
    lateLight: '#FFF3E0',
    missed: '#E53935',
    missedLight: '#FFEBEE',
  },

  // Vitals thresholds
  vitals: {
    normal: '#4CAF50',
    normalLight: '#E8F5E9',
    warning: '#FF9800',
    warningLight: '#FFF3E0',
    critical: '#E53935',
    criticalLight: '#FFEBEE',
  },

  // Borders
  border: {
    light: '#E0E0E0',
    main: '#BDBDBD',
    dark: '#9E9E9E',
  },

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  shadow: 'rgba(0, 0, 0, 0.1)',
};

/**
 * Typography
 * Target: Readable, scalable, accessible (WCAG AA)
 */
export const Typography = {
  fontFamily: {
    regular: 'System', // System font for now, can add custom later
    medium: 'System',
    bold: 'System',
  },

  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

/**
 * Spacing (8pt grid system)
 */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

/**
 * Border Radius
 */
export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

/**
 * Shadows (elevation)
 */
export const Shadows = {
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
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
};

/**
 * Touch targets (minimum 44x44 for accessibility)
 */
export const TouchTargets = {
  min: 44, // Minimum touch target size
  recommended: 48, // Recommended size for primary actions
};

/**
 * Layout
 */
export const Layout = {
  containerPadding: Spacing.md,
  screenPadding: Spacing.lg,
  cardPadding: Spacing.md,
  maxContentWidth: 600, // For tablets
};

/**
 * Animations (gentle, calm)
 */
export const Animation = {
  duration: {
    fast: 150,
    normal: 250,
    slow: 350,
  },
  easing: {
    standard: 'ease-in-out',
    decelerate: 'ease-out',
    accelerate: 'ease-in',
  },
};
