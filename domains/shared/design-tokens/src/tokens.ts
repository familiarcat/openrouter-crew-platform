/**
 * OpenRouter Crew Platform - Design Tokens
 * Single source of truth for all visual design decisions.
 * These tokens are consumed by CSS variables, Tailwind config, and Lit components.
 */

export const colors = {
  // Brand / Primary
  primary: '#4A9EFF',       // --cr-color-primary
  primaryHover: '#3B8FEF',
  primaryActive: '#2C7FDF',
  primaryForeground: '#000000',

  // Accent
  accent: '#7C3AED',        // --cr-color-accent
  accentHover: '#6D28D9',
  accentForeground: '#FFFFFF',

  // Status
  success: '#10B981',
  successForeground: '#000000',
  warning: '#F59E0B',
  warningForeground: '#000000',
  error: '#EF4444',
  errorForeground: '#FFFFFF',
  info: '#3B82F6',
  infoForeground: '#FFFFFF',

  // Neutral grays (dark-theme default)
  gray50:  '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  gray950: '#0A0F1A',

  // Semantic surface colors (dark default)
  background:        '#0D1117',   // --cr-bg
  backgroundSecondary: '#161B22', // --cr-bg-secondary
  backgroundTertiary:  '#1C2128', // --cr-bg-tertiary

  surface:           '#161B22',   // --cr-surface (card/panel)
  surfaceHover:      '#1C2128',
  surfaceActive:     '#21262D',

  // Text
  textPrimary:    '#E6EDF3',      // --cr-text
  textSecondary:  '#8B949E',      // --cr-text-secondary
  textMuted:      '#6E7681',      // --cr-text-muted
  textDisabled:   '#484F58',      // --cr-text-disabled
  textInverse:    '#0D1117',      // --cr-text-inverse

  // Border
  border:         'rgba(48, 54, 61, 1)',   // --cr-border
  borderMuted:    'rgba(48, 54, 61, 0.6)', // --cr-border-muted
  borderFocus:    '#4A9EFF',               // --cr-border-focus

  // Overlay
  overlay:        'rgba(1, 4, 9, 0.8)',    // --cr-overlay
} as const

export const spacing = {
  px:   '1px',
  '0':  '0',
  '0.5': '2px',
  '1':  '4px',
  '1.5': '6px',
  '2':  '8px',
  '2.5': '10px',
  '3':  '12px',
  '3.5': '14px',
  '4':  '16px',
  '5':  '20px',
  '6':  '24px',
  '7':  '28px',
  '8':  '32px',
  '9':  '36px',
  '10': '40px',
  '11': '44px',
  '12': '48px',
  '14': '56px',
  '16': '64px',
  '20': '80px',
  '24': '96px',
  '28': '112px',
  '32': '128px',
} as const

export const radii = {
  none:   '0',
  sm:     '4px',
  md:     '6px',
  lg:     '8px',
  xl:     '12px',
  '2xl':  '16px',
  '3xl':  '24px',
  full:   '9999px',
} as const

export const typography = {
  fontFamily: {
    sans:  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono:  '"JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, monospace',
  },
  fontSize: {
    xs:   '11px',
    sm:   '12px',
    base: '14px',
    md:   '14px',
    lg:   '16px',
    xl:   '18px',
    '2xl': '20px',
    '3xl': '24px',
    '4xl': '30px',
    '5xl': '36px',
  },
  fontWeight: {
    normal:   '400',
    medium:   '500',
    semibold: '600',
    bold:     '700',
  },
  lineHeight: {
    none:    '1',
    tight:   '1.25',
    snug:    '1.375',
    normal:  '1.5',
    relaxed: '1.625',
    loose:   '2',
  },
  letterSpacing: {
    tight:   '-0.015em',
    normal:  '0',
    wide:    '0.025em',
    wider:   '0.05em',
    widest:  '0.1em',
  },
} as const

export const shadows = {
  sm:   '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
  md:   '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(0, 0, 0, 0.3)',
  lg:   '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.3)',
  xl:   '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
  glow: '0 0 20px rgba(74, 158, 255, 0.3)',
} as const

export const transitions = {
  fast:   'all 100ms ease',
  base:   'all 150ms ease',
  slow:   'all 300ms ease',
  spring: 'all 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const

export const zIndex = {
  hide:     '-1',
  base:     '0',
  raised:   '1',
  dropdown: '1000',
  sticky:   '1100',
  overlay:  '1300',
  modal:    '1400',
  popover:  '1500',
  toast:    '1700',
  tooltip:  '1800',
} as const

/** All tokens as a flat object for programmatic access */
export const tokens = {
  colors,
  spacing,
  radii,
  typography,
  shadows,
  transitions,
  zIndex,
} as const

export type ColorToken = keyof typeof colors
export type SpacingToken = keyof typeof spacing
export type RadiusToken = keyof typeof radii
