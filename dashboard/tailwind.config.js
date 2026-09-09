/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        command: {
          bg: '#0B0F17',
          surface: '#131A26',
          card: '#1A2333',
          border: '#2A364F',
          text: '#E2E8F0',
          muted: '#8A99AD',
        },
        risk: {
          low: '#10B981',
          medium: '#F59E0B',
          high: '#F97316',
          critical: '#EF4444',
        },
      },
    },
  },
  plugins: [],
};
