import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './contexts/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        wa: '#25D366',
        surface: {
          950: '#06080d',
          900: '#0b0f17',
          800: '#11151f',
          700: '#181d2a',
          600: '#222838',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        'glow-pulse': 'glowPulse 2.4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px 0 rgba(0,0,0,0.08)',
        glow: '0 0 0 1px rgba(34,197,94,0.15), 0 8px 24px -4px rgba(34,197,94,0.25)',
        'glow-cyan': '0 0 0 1px rgba(34,211,238,0.15), 0 8px 24px -4px rgba(34,211,238,0.25)',
        glass: '0 1px 0 0 rgba(255,255,255,0.06) inset, 0 8px 32px -8px rgba(0,0,0,0.6)',
      },
      backgroundImage: {
        'grid-glow':
          'radial-gradient(circle at 20% 0%, rgba(34,197,94,0.12), transparent 40%), radial-gradient(circle at 80% 0%, rgba(34,211,238,0.10), transparent 40%)',
      },
    },
  },
  plugins: [],
};

export default config;
