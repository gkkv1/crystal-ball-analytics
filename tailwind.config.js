/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: {
          50:  '#EEF2F7',
          100: '#D5DFF0',
          200: '#AAC0E1',
          300: '#7FA0D3',
          400: '#5580C4',
          500: '#2B61B5',
          600: '#1E3A5F',
          700: '#162D4A',
          800: '#0F1F35',
          900: '#071220',
        },
        brand: {
          blue:  '#2563EB',
          teal:  '#0891B2',
          navy:  '#1E3A5F',
        },
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
    },
  },
  plugins: [],
}
