/**
 * Unified Design System for Memory Dashboard
 * Shared tokens for HTML, React, and CLI interfaces
 */

// ============================================
// COLOR PALETTE
// ============================================

export const colors = {
  // Primary
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },

  // Semantic - Memory Layers
  layer: {
    1: { // Observations
      bg: '#dbeafe',
      border: '#3b82f6',
      text: '#1e40af',
      dark: '#1e3a8a',
    },
    2: { // Patterns
      bg: '#e9d5ff',
      border: '#a855f7',
      text: '#6b21a8',
      dark: '#5b21b6',
    },
    3: { // Strategies
      bg: '#fed7aa',
      border: '#f59e0b',
      text: '#92400e',
      dark: '#78350f',
    },
    4: { // Institutional
      bg: '#fecaca',
      border: '#ef4444',
      text: '#7f1d1d',
      dark: '#7f1d1d',
    },
  },

  // Neutral
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // Status
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },

  // Feedback
  feedback: {
    success: { bg: '#d1fae5', text: '#065f46' },
    warning: { bg: '#fef3c7', text: '#78350f' },
    error: { bg: '#fee2e2', text: '#991b1b' },
    info: { bg: '#dbeafe', text: '#1e40af' },
  },

  // Text
  text: {
    primary: '#111827',
    secondary: '#6b7280',
    tertiary: '#9ca3af',
    inverse: '#ffffff',
  },

  // Background
  bg: {
    primary: '#ffffff',
    secondary: '#f9fafb',
    tertiary: '#f3f4f6',
  },

  // Border
  border: {
    light: '#f3f4f6',
    default: '#e5e7eb',
    dark: '#d1d5db',
  },
};

// ============================================
// SPACING & SIZING
// ============================================

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '40px',
  '4xl': '48px',
};

export const sizes = {
  // Border Radius
  radius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    full: '9999px',
  },

  // Border Width
  border: {
    none: '0',
    thin: '1px',
    base: '2px',
    thick: '4px',
  },
};

// ============================================
// TYPOGRAPHY
// ============================================

export const typography = {
  fontFamily: {
    system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: '"Fira Code", "Monaco", "Menlo", monospace',
  },

  fontSize: {
    xs: { size: '11px', height: '14px' },
    sm: { size: '12px', height: '16px' },
    base: { size: '13px', height: '18px' },
    lg: { size: '14px', height: '20px' },
    xl: { size: '16px', height: '24px' },
    '2xl': { size: '20px', height: '28px' },
    '3xl': { size: '24px', height: '32px' },
    '4xl': { size: '32px', height: '40px' },
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeight: {
    tight: 1.4,
    normal: 1.6,
    relaxed: 1.8,
  },
};

// ============================================
// SHADOWS & EFFECTS
// ============================================

export const effects = {
  shadow: {
    none: 'none',
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
  },

  transition: {
    fast: '0.15s ease-out',
    base: '0.2s ease-out',
    slow: '0.3s ease-out',
  },

  opacity: {
    disabled: 0.5,
    hover: 0.8,
    focus: 1,
  },
};

// ============================================
// COMPONENT STYLES
// ============================================

export const components = {
  // Buttons
  button: {
    base: {
      padding: `${spacing.sm} ${spacing.lg}`,
      borderRadius: sizes.radius.md,
      fontWeight: typography.fontWeight.medium,
      fontSize: typography.fontSize.sm.size,
      border: 'none',
      cursor: 'pointer',
      transition: effects.transition.fast,
      fontFamily: typography.fontFamily.system,
    },
    primary: {
      bg: colors.primary[500],
      color: colors.text.inverse,
      hover: colors.primary[600],
    },
    secondary: {
      bg: colors.gray[100],
      color: colors.text.primary,
      border: `${sizes.border.thin} solid ${colors.border.default}`,
      hover: colors.gray[200],
    },
    disabled: {
      bg: colors.gray[400],
      color: colors.text.inverse,
      opacity: effects.opacity.disabled,
      cursor: 'not-allowed',
    },
  },

  // Cards
  card: {
    base: {
      bg: colors.bg.primary,
      borderRadius: sizes.radius.xl,
      border: `${sizes.border.thin} solid ${colors.border.default}`,
      boxShadow: effects.shadow.base,
      padding: spacing.xl,
    },
    elevated: {
      boxShadow: effects.shadow.lg,
    },
  },

  // Input
  input: {
    base: {
      padding: `${spacing.sm} ${spacing.md}`,
      borderRadius: sizes.radius.md,
      border: `${sizes.border.thin} solid ${colors.border.default}`,
      fontSize: typography.fontSize.sm.size,
      fontFamily: typography.fontFamily.system,
      transition: effects.transition.fast,
    },
    focus: {
      borderColor: colors.primary[500],
      boxShadow: `0 0 0 3px ${colors.primary[50]}`,
      outline: 'none',
    },
  },

  // Badge
  badge: {
    base: {
      display: 'inline-block',
      padding: `${spacing.xs} ${spacing.md}`,
      borderRadius: sizes.radius.sm,
      fontSize: typography.fontSize.xs.size,
      fontWeight: typography.fontWeight.medium,
    },
  },

  // Progress Bar
  progressBar: {
    base: {
      height: '8px',
      bg: colors.gray[200],
      borderRadius: sizes.radius.md,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      bg: colors.primary[500],
      transition: effects.transition.base,
    },
  },

  // Tag
  tag: {
    base: {
      display: 'inline-block',
      padding: `${spacing.xs} ${spacing.md}`,
      borderRadius: sizes.radius.sm,
      fontSize: typography.fontSize.xs.size,
      bg: colors.gray[100],
      color: colors.gray[700],
      marginRight: spacing.sm,
      marginBottom: spacing.sm,
    },
  },
};

// ============================================
// RESPONSIVE BREAKPOINTS
// ============================================

export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// ============================================
// ANIMATION KEYFRAMES
// ============================================

export const animations = {
  slideUp: `
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,
  fadeIn: `
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
  `,
  spin: `
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `,
};

// ============================================
// UTILITY HELPERS
// ============================================

export function getCSSVariables(): string {
  return `
    :root {
      /* Colors */
      --color-primary-500: ${colors.primary[500]};
      --color-primary-600: ${colors.primary[600]};
      --color-gray-50: ${colors.gray[50]};
      --color-gray-100: ${colors.gray[100]};
      --color-gray-200: ${colors.gray[200]};
      --color-gray-700: ${colors.gray[700]};
      --color-gray-900: ${colors.gray[900]};
      --color-text-primary: ${colors.text.primary};
      --color-text-secondary: ${colors.text.secondary};
      --color-border-default: ${colors.border.default};

      /* Layer Colors */
      --color-layer-1-bg: ${colors.layer[1].bg};
      --color-layer-1-border: ${colors.layer[1].border};
      --color-layer-1-text: ${colors.layer[1].text};

      --color-layer-2-bg: ${colors.layer[2].bg};
      --color-layer-2-border: ${colors.layer[2].border};
      --color-layer-2-text: ${colors.layer[2].text};

      --color-layer-3-bg: ${colors.layer[3].bg};
      --color-layer-3-border: ${colors.layer[3].border};
      --color-layer-3-text: ${colors.layer[3].text};

      --color-layer-4-bg: ${colors.layer[4].bg};
      --color-layer-4-border: ${colors.layer[4].border};
      --color-layer-4-text: ${colors.layer[4].text};

      /* Spacing */
      --spacing-sm: ${spacing.sm};
      --spacing-md: ${spacing.md};
      --spacing-lg: ${spacing.lg};
      --spacing-xl: ${spacing.xl};

      /* Sizing */
      --radius-md: ${sizes.radius.md};
      --radius-lg: ${sizes.radius.lg};
      --radius-xl: ${sizes.radius.xl};

      /* Typography */
      --font-family-system: ${typography.fontFamily.system};
      --font-family-mono: ${typography.fontFamily.mono};
      --font-weight-medium: ${typography.fontWeight.medium};
      --font-weight-semibold: ${typography.fontWeight.semibold};
      --font-weight-bold: ${typography.fontWeight.bold};

      /* Effects */
      --shadow-base: ${effects.shadow.base};
      --shadow-md: ${effects.shadow.md};
      --transition-base: ${effects.transition.base};
    }
  `;
}

// Helper to get layer colors by number
export function getLayerColors(layer: 1 | 2 | 3 | 4) {
  return colors.layer[layer];
}

// Helper to get status colors
export function getStatusColors(status: 'success' | 'warning' | 'error' | 'info') {
  return colors.status[status];
}

// Helper to create CSS grid
export function createGrid(columns: number, gap: string = spacing.lg): string {
  return `
    display: grid;
    grid-template-columns: repeat(${columns}, 1fr);
    gap: ${gap};
  `;
}

// ============================================
// DESIGN SYSTEM EXPORT
// ============================================

export const designSystem = {
  colors,
  spacing,
  sizes,
  typography,
  effects,
  components,
  breakpoints,
  animations,
};
