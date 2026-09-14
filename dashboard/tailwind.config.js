/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // High-contrast Deep Futuristic Navy/Slate Backgrounds
        slate: {
          950: '#030712', // Deep Space Background
          900: '#0b1329', // Card & Panel Background
          800: '#152347', // Glowing Border / Container Background
          700: '#223563', // Inputs, Buttons & Secondary Borders
          600: '#385188', // Divider Lines & Muted Borders
          500: '#64748b', // Muted Text
          400: '#94a3b8', // Readable Subtitles & Labels
          300: '#cbd5e1', // High Contrast Body Text
          200: '#e2e8f0', // Crisp Heading Text
          100: '#f8fafc', // Ultra Bright Highlight
        },
        // Cyber Neon Accents for Maximum Visibility
        cyan: {
          300: '#67e8f9',
          400: '#22d3ee', // Neon Cyan Accent
          500: '#06b6d4', // Primary Cyan Button/Focus
          600: '#0891b2',
        },
        emerald: {
          400: '#34d399', // Bright Glowing Green for LIVE Status
          500: '#10b981',
        },
        amber: {
          400: '#fbbf24', // Warning Glowing Amber for MOCK Status
          500: '#f59e0b',
        },
      },
      // Fancy Glow Effects & Custom Shadows
      boxShadow: {
        'glow-cyan': '0 0 15px -3px rgba(34, 211, 238, 0.4)',
        'glow-emerald': '0 0 15px -3px rgba(52, 211, 153, 0.4)',
        'glow-amber': '0 0 15px -3px rgba(251, 191, 36, 0.4)',
        'card-dark': '0 10px 30px -10px rgba(0, 0, 0, 0.8)',
      },
      // Smooth Animation Delays
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}