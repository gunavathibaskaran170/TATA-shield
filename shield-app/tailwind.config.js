/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
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
        sans: ['"Segoe UI"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"Cascadia Mono"', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};