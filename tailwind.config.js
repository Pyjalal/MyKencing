/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './index.html',
  ],
  presets: [require('nativewind/preset')],
  important: 'html',
  theme: {
    extend: {
      colors: {
        // Primary - Soft Teal (Healthcare Trust) - Matches Figma design
        'primary': {
          DEFAULT: '#2D9F9F',
          light: '#5DBFBF',
          dark: '#1E7A7A',
        },

        // Secondary - Warm Coral (Gentle Alerts)
        'secondary': {
          DEFAULT: '#FF9F7F',
          light: '#FFB89F',
          dark: '#E57F5F',
        },

        // Accent - Sunny Yellow (Gamification)
        'accent': {
          DEFAULT: '#F59E0B',
          light: '#FBBF24',
          dark: '#D97706',
        },

        // Status Colors
        'error': {
          DEFAULT: '#e66a6a',
          light: '#ffd0d0',
        },
        'warning': '#f0c400',
        'success': {
          DEFAULT: '#58a67c',
          dark: '#3d7957',
        },

        // Backgrounds
        'background': {
          DEFAULT: '#eff1fe',
          card: '#ffffff',
        },

        // Text Colors
        'text': {
          primary: '#2c3442',
          secondary: '#5a6d8a',
          tertiary: '#8fa2b9',
        },
      },

      borderRadius: {
        'card': '20px',
        'pill': '50px',
      },

      fontSize: {
        '2xl': '24px',
        '3xl': '32px',
      },
    },
  },
  plugins: [],
};
