/**
 * Design System Tokens
 * Combining Duolingo aesthetics with Brilliant interactivity
 */

// ============ COLOR TOKENS ============
export const colors = {
  // Surfaces
  bg: '#F0F0F0',
  surface: '#FFFFFF',
  surfaceMuted: '#F7F7F7',
  surfaceElevated: '#FFFFFF',

  // Text
  text: '#4B4B4B',
  textMuted: '#737373',
  textSubtle: '#6F6F6F',
  textInverse: '#FFFFFF',

  // Borders
  border: '#E5E5E5',
  borderFocus: '#84D8FF',
  borderSelected: '#1CB0F6',

  // Primary (Green - Duolingo signature)
  primary: '#58CC02',
  primaryHover: '#61D800',
  primaryShadow: '#46A302',
  primaryLight: '#89E219',

  // Secondary (Blue)
  secondary: '#1CB0F6',
  secondaryHover: '#14B8FF',
  secondaryShadow: '#1899D6',
  secondaryTint: '#DDF4FF',

  // Feedback
  success: '#58CC02',
  successTint: '#D7FFB8',
  danger: '#FF4B4B',
  dangerDark: '#EA2B2B',
  dangerTint: '#FFDFE0',
  warning: '#FFC800',
  warningTint: '#FFF4CC',

  // Gamification
  xp: '#8549BA',
  xpLight: '#CE82FF',
  xpTint: '#F3E5FF',
  streak: '#FF9600',
  streakTint: '#FFF0D5',
  crown: '#FFC800',
  gem: '#1CB0F6',
  heart: '#FF4B4B',

  // Skill domains (for financial topics)
  banking: '#1CB0F6',
  credit: '#8549BA',
  investing: '#58CC02',
  taxes: '#FF9600',
  budgeting: '#00CD9C',
  crypto: '#FFD900',
} as const;

// ============ DARK MODE TOKENS ============
export const darkColors = {
  bg: 'rgb(19, 31, 36)',
  surface: 'rgb(32, 47, 54)',
  surfaceMuted: 'rgb(26, 39, 45)',
  text: 'rgb(220, 230, 236)',
  textMuted: 'rgb(160, 175, 185)',
  textInverse: 'rgb(19, 31, 36)',
  border: 'rgb(55, 75, 85)',
  primary: 'rgb(147, 211, 51)',
  secondary: 'rgb(73, 192, 248)',
  danger: 'rgb(238, 85, 85)',
  warning: 'rgb(255, 199, 0)',
} as const;

// ============ SPACING TOKENS ============
export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
} as const;

// ============ BORDER RADIUS TOKENS ============
export const radii = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  full: '9999px',
} as const;

// ============ SHADOW TOKENS ============
export const shadows = {
  // Duolingo 3D button shadows
  buttonGreen: '0 4px 0 #46A302',
  buttonGreenLg: '0 5px 0 #46A302',
  buttonBlue: '0 4px 0 #1899D6',
  buttonGray: '0 4px 0 #E5E5E5',
  buttonDanger: '0 4px 0 #EA2B2B',
  
  // Card shadows
  card: '0 2px 10px rgba(0, 0, 0, 0.08)',
  cardHover: '0 4px 20px rgba(0, 0, 0, 0.12)',
  
  // Overlay shadows
  modal: '0 8px 32px rgba(0, 0, 0, 0.24)',
  dropdown: '0 4px 16px rgba(0, 0, 0, 0.16)',
} as const;

// ============ TYPOGRAPHY TOKENS ============
export const typography = {
  fontFamily: {
    display: '"Nunito", system-ui, -apple-system, sans-serif',
    body: '"Nunito", system-ui, -apple-system, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
  },
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '28px',
    '4xl': '32px',
    '5xl': '40px',
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  lineHeight: {
    tight: 1.15,
    snug: 1.25,
    normal: 1.4,
    relaxed: 1.6,
  },
} as const;

// ============ ANIMATION TOKENS ============
export const animation = {
  duration: {
    instant: 100,
    fast: 150,
    normal: 250,
    slow: 400,
    progress: 700,
    celebration: 2000,
  },
  easing: {
    standard: 'ease-in-out',
    out: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  spring: {
    stiffness: 400,
    damping: 17,
  },
} as const;

// ============ Z-INDEX TOKENS ============
export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  modal: 300,
  toast: 400,
  tooltip: 500,
} as const;

// ============ BREAKPOINTS ============
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
} as const;

