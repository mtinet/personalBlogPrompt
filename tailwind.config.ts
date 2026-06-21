import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff', 100: '#e0e7ff', 300: '#a5b4fc', 400: '#818cf8',
          600: '#4f46e5', 700: '#4338ca', 900: '#312e81',
        },
      },
    },
  },
  plugins: [],
};

export default config;
