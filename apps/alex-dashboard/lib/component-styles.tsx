import { CSSProperties } from 'react';

// Centralized Design System Types
export type ComponentSize = 'sm' | 'md' | 'lg';
export type ComponentVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

// Standardized Size Styles
export const sizeStyles: Record<ComponentSize, CSSProperties> = {
  sm: { padding: '0.5rem 1rem', fontSize: '0.875rem', borderRadius: '0.375rem' },
  md: { padding: '0.75rem 1.5rem', fontSize: '1rem', borderRadius: '0.5rem' },
  lg: { padding: '1rem 2rem', fontSize: '1.125rem', borderRadius: '0.75rem' },
};

// Standardized Variant Styles (using CSS variables from globals.css)
export const variantStyles: Record<ComponentVariant, CSSProperties> = {
  primary: {
    backgroundColor: 'var(--alex-purple, #7c5cff)',
    color: '#ffffff',
    border: '1px solid transparent',
  },
  secondary: {
    backgroundColor: 'var(--alex-blue, #0077b6)',
    color: '#ffffff',
    border: '1px solid transparent',
  },
  outline: {
    backgroundColor: 'transparent',
    color: 'var(--foreground)',
    border: '1px solid var(--border, rgba(255,255,255,0.2))',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: 'var(--foreground)',
    border: '1px solid transparent',
  },
  danger: {
    backgroundColor: 'var(--alex-magenta, #ff5c93)',
    color: '#ffffff',
    border: '1px solid transparent',
  },
};

// Alias for backward compatibility and specific use cases
export const ctaStyles = variantStyles;

// Card Styles
export const cardStyles: CSSProperties = {
  backgroundColor: 'var(--card-bg, rgba(255,255,255,0.05))',
  border: '1px solid var(--border, rgba(255,255,255,0.1))',
  borderRadius: 'var(--radius, 12px)',
  padding: 'var(--spacing-lg, 24px)',
};
