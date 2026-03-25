/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0b1220',
          secondary: '#111827',
          panel: '#141c2d',
          card: '#1b2538',
          hover: '#23304a',
        },
        border: {
          subtle: '#253149',
          DEFAULT: '#32415f',
        },
        text: {
          primary: '#f8fbff',
          secondary: '#c7d4ea',
          muted: '#8fa0bd',
        },
        signal: {
          normal: '#6b7280',
          warning: '#d97706',
          alert: '#ef4444',
          critical: '#dc2626',
        },
        accent: {
          blue: '#265CD1',
          cyan: '#8FB3FF',
          purple: '#4B82F1',
        },
      },
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'Fira Code', 'monospace'],
      },
      keyframes: {
        morph: {
          '0%, 100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
          '33%': { borderRadius: '40% 60% 70% 30% / 50% 40% 60% 50%' },
          '66%': { borderRadius: '30% 70% 40% 60% / 40% 70% 30% 60%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(1)', opacity: '0.6' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        rotate3d: {
          '0%': { transform: 'rotateY(0deg) rotateX(0deg)' },
          '100%': { transform: 'rotateY(360deg) rotateX(30deg)' },
        },
      },
      animation: {
        morph: 'morph 8s ease-in-out infinite',
        float: 'float 4s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2s ease-out infinite',
        rotate3d: 'rotate3d 12s linear infinite',
      },
    },
  },
  plugins: [],
};
