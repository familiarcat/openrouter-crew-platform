import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Alex AI / Star Trek Division Colors
        'alex-purple': '#7c5cff',
        'alex-blue': '#0077b6',
        'alex-gold': '#c9a227',
        'alex-cyan': '#00c2ff',
        'alex-magenta': '#ff5c93',
        'alex-red': '#c41e3a',
        'alex-brown': '#8b7355',
        
        // UI Neutrals
        'space-dark': '#0d1022',
        'space-darker': '#0b0f1d',
        'space-card': 'rgba(255, 255, 255, 0.05)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'alex-gradient': 'linear-gradient(180deg, rgba(13,16,34,.88), rgba(11,15,29,.62))',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;