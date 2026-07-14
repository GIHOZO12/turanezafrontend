/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./public/index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1E88E5',
        mint: '#34D399',
        sunshine: '#FBBF24',
        clay: '#9CA3AF',
        porcelain: '#F9FAFB',
      },
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Merriweather', 'ui-serif', 'Georgia', 'serif'],
      },
      borderRadius: {
        pill: '9999px',
        card: '16px',
      },
      boxShadow: {
        card: '0 20px 45px -20px rgba(30, 136, 229, 0.35)',
      },
      transitionTimingFunction: {
        cozy: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      },
      transitionDuration: {
        cozy: '200ms',
      },
    },
  },
  plugins: [],
};
