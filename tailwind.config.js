/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
          600: '#475569',
        },
        terracotta: {
          DEFAULT: '#e07a5f',
          light: '#e8967f',
          dark: '#c4603f',
        },
        olive: {
          DEFAULT: '#81b29a',
          light: '#a3c9b5',
          dark: '#5f9a7e',
        },
        cream: {
          DEFAULT: '#f4f1de',
          dark: '#e8e4cc',
        },
        coral: {
          DEFAULT: '#f2cc8f',
          light: '#f5d9a8',
          dark: '#e0b56e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-up': 'floatUp 1.5s ease-out forwards',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        floatUp: {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(-60px)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
