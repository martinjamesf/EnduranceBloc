/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#ffffff',
      black: '#000000',
      slate: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a'
      },
      red: {
        500: '#ef4444',
        600: '#dc2626'
      },
      primary: '#0D1D35',
      secondary: '#FF7A00',
      aeroTeal: '#00C2A8',
      swim: '#0077FF',
      bike: '#F2C94C',
      run: '#EB5757'
    },
    extend: {}
  },
  plugins: []
};