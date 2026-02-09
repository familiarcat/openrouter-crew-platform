'use client';
import React from 'react';
import Link from 'next/link';

export default function ThemeAwareCTA({ href, children, variant = 'primary' }: any) {
  const styles = {
    primary: 'bg-blue-600 hover:bg-blue-500 text-white border-transparent',
    secondary: 'bg-purple-600 hover:bg-purple-500 text-white border-transparent',
    outline: 'bg-transparent hover:bg-white/5 text-white border-white/20'
  };

  return (
    <Link 
      href={href}
      className={`inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium text-sm transition-all border ${styles[variant as keyof typeof styles]}`}
    >
      {children}
    </Link>
  );
}
