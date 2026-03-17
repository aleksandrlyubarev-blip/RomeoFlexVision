/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#1a1d23',
          secondary: '#1f2330',
          panel: '#252a38',
          card: '#2a3040',
          hover: '#303749',
        },
        border: {
          subtle: '#323a52',
          DEFAULT: '#404968',
        },
        text: {
          primary: '#cdd6f4',
          secondary: '#a6adc8',
          muted: '#6c7086',
        },
        signal: {
          normal: '#6b7280',
          warning: '#d97706',
          alert: '#ef4444',
          critical: '#dc2626',
        },
        accent: {
          blue: '#7aa2f7',
          cyan: '#73daca',
          purple: '#9d7cd8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
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
