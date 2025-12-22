/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primaryNavy: '#0D1D35',
        cadenceOrange: '#FF7A00',
        aeroTeal: '#00C2A8',
        swim: '#0077FF',
        bike: '#F2C94C',
        run: '#EB5757'
      }
    }
  },
  plugins: []
};