/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Tailwind/Shadcn semantic names (HSL bridge vars) ──────────────
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // ── Crew design token direct references (--cr-* vars) ─────────────
        // Use these for components that should share tokens with VSCode.
        // e.g.: className="bg-cr-surface text-cr-text border-cr-border"
        cr: {
          bg:                'var(--cr-bg)',
          'bg-secondary':    'var(--cr-bg-secondary)',
          'bg-tertiary':     'var(--cr-bg-tertiary)',
          surface:           'var(--cr-surface)',
          'surface-hover':   'var(--cr-surface-hover)',
          'surface-active':  'var(--cr-surface-active)',
          text:              'var(--cr-text)',
          'text-secondary':  'var(--cr-text-secondary)',
          'text-muted':      'var(--cr-text-muted)',
          'text-disabled':   'var(--cr-text-disabled)',
          border:            'var(--cr-border)',
          'border-muted':    'var(--cr-border-muted)',
          'border-focus':    'var(--cr-border-focus)',
          primary:           'var(--cr-color-primary)',
          'primary-hover':   'var(--cr-color-primary-hover)',
          accent:            'var(--cr-color-accent)',
          success:           'var(--cr-color-success)',
          warning:           'var(--cr-color-warning)',
          error:             'var(--cr-color-error)',
          info:              'var(--cr-color-info)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        // Crew token aliases
        'cr-sm':   'var(--cr-radius-sm)',
        'cr-md':   'var(--cr-radius-md)',
        'cr-lg':   'var(--cr-radius-lg)',
        'cr-xl':   'var(--cr-radius-xl)',
        'cr-2xl':  'var(--cr-radius-2xl)',
        'cr-full': 'var(--cr-radius-full)',
      },
      fontFamily: {
        sans: ['var(--cr-font-sans)'],
        mono: ['var(--cr-font-mono)'],
      },
      boxShadow: {
        'cr-sm':   'var(--cr-shadow-sm)',
        'cr-md':   'var(--cr-shadow-md)',
        'cr-lg':   'var(--cr-shadow-lg)',
        'cr-xl':   'var(--cr-shadow-xl)',
        'cr-glow': 'var(--cr-shadow-glow)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [],
}
