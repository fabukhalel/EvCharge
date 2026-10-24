/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Tajawal', 'system-ui', 'sans-serif'] },
      colors: {
        ink: { 950: '#04060c', 900: '#080b14', 800: '#0d1220', 700: '#141b2e', 600: '#1d2640' },
        accent: '#22d3ee',
        home: '#2ef2a0',
        fast: '#ff9a3c',
      },
      boxShadow: {
        glow: '0 0 28px -6px rgba(34,211,238,.45)',
        'glow-home': '0 0 24px -6px rgba(46,242,160,.4)',
        'glow-fast': '0 0 24px -6px rgba(255,154,60,.4)',
      },
      keyframes: {
        sheet: { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        fade: { from: { opacity: '0' }, to: { opacity: '1' } },
        toast: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        sheet: 'sheet .28s cubic-bezier(.2,.8,.2,1)',
        fade: 'fade .2s ease-out',
        toast: 'toast .25s ease-out',
      },
    },
  },
  plugins: [],
};
