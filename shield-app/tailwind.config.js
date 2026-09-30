/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        graphite: '#06090f',
        panel: '#0d121b',
        accent: '#38d9cf',
        engineering: '#4f8cff',
        ok: '#4fe0a0',
        warn: '#f2b94e',
        danger: '#ff6b5e',
        hv: '#ff8a2a',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', '"Segoe UI"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Cascadia Mono"', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};