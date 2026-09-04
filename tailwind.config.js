/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        ink: '#0c0c12',
        surface: '#141420',
        muted: '#9090a8',
        pink: '#f72585',
        purple: '#9d4edd',
        line: 'rgba(255,255,255,0.08)',
      },
      borderRadius: {
        screen: '40px',
        card: '24px',
        'card-sm': '20px',
        'card-xs': '18px',
        row: '16px',
        cta: '30px',
        pill: '999px',
      },
      fontFamily: {
        display: ['Unbounded', 'Impact', 'Arial Black', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      backgroundImage: {
        cta: 'linear-gradient(90deg, #9d4edd, #f72585)',
      },
      boxShadow: {
        glow: '0 0 24px rgba(247,37,133,0.45)',
        'glow-purple': '0 0 24px rgba(157,78,221,0.45)',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
    },
  },
  plugins: [],
};
