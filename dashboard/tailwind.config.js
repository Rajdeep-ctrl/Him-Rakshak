/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sand: {
          50: '#f9f5f0',
          100: '#f3eee7',
          200: '#e8ddd1',
          300: '#d9c7b0',
        },
        forest: {
          500: '#2c5c4d',
          600: '#234e42',
        },
        clay: {
          500: '#d47548',
          600: '#bb603a',
        },
        olive: {
          500: '#6f8a5e',
        },
        ink: {
          900: '#201d1a',
          700: '#4d4642',
        },
      },
      boxShadow: {
        soft: '0 18px 42px rgba(32, 29, 26, 0.08)',
        card: '0 12px 30px rgba(39, 46, 42, 0.08)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}