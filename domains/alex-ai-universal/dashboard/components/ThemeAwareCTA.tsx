'use client';

import React from 'react';
import Link from 'next/link';

interface ThemeAwareCTAProps {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  icon?: React.ReactNode;
}

export default function ThemeAwareCTA({
  href,
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  onClick,
  icon
}: ThemeAwareCTAProps) {
  
  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderRadius: '8px',
    fontWeight: 600,
    transition: 'all 0.2s ease',
    textDecoration: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    pointerEvents: disabled ? 'none' : 'auto',
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: '6px 12px', fontSize: '0.875rem' },
    md: { padding: '10px 20px', fontSize: '1rem' },
    lg: { padding: '14px 28px', fontSize: '1.125rem' },
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: 'var(--alex-purple, #7c5cff)',
      color: 'white',
      border: 'none',
    },
    secondary: {
      background: 'var(--alex-blue, #0077b6)',
      color: 'white',
      border: 'none',
    },
    outline: {
      background: 'transparent',
      color: 'var(--foreground)',
      border: '1px solid var(--border)',
    },
  };

  const combinedStyles: React.CSSProperties = {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
  };

  if (disabled) {
    return (
      <span style={combinedStyles} className={className}>
        {icon && <span>{icon}</span>}
        {children}
      </span>
    );
  }

  return (
    <Link 
      href={href} 
      style={combinedStyles} 
      className={className}
      onClick={onClick}
    >
      {icon && <span>{icon}</span>}
      {children}
    </Link>
  );
}
