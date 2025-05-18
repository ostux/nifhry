/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'pine-green': {
          50: '#f1fcfa',
          100: '#cef9ee',
          200: '#9df2de',
          300: '#64e4cb',
          400: '#34cdb4',
          500: '#1bb19a',
          600: '#138e7e',
          700: '#157a6e',
          800: '#145b53',
          900: '#164b46',
          950: '#062d2a'
        }
      }
    }
  },
  plugins: ['@tailwindcss/forms']
};
