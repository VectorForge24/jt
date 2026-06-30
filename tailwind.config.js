/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enables manual dark mode toggling
  theme: {
    extend: {
      colors: {
        tracker: {
          bg: '#1a1a1a', 
          surface: '#f8fafc',
          sidebar: '#1e293b',
          purple: '#c4b5fd', 
          blue: '#bae6fd', 
          lime: '#d9f99d' 
        }
      }
    },
  },
  plugins: [],
}