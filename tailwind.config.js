/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0B0B0B',
        charcoal: '#171717',
        panel: '#1D1D1F',
        accent: '#FF7900',
        accent2: '#FF9B42',
      },
      boxShadow: {
        glow: '0 0 18px rgba(255,121,0,0.45)',
        'glow-sm': '0 0 10px rgba(255,121,0,0.35)',
      },
      animation: {
        fadeIn: 'fadeIn 0.25s ease-out',
        popIn: 'popIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        popIn: {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
