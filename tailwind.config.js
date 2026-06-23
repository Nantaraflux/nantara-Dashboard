/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0A0E1A',
          surface: '#111827',
          elevated: '#1A2235',
        },
        border: {
          DEFAULT: '#1F2D40',
        },
        accent: {
          primary: '#0F6E56',
          secondary: '#1D9E75',
        },
        txt: {
          primary: '#F0F4F8',
          secondary: '#8B9AB0',
          tertiary: '#4A5568',
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        label: ['13px', { lineHeight: '18px', fontWeight: '500' }],
        metric: ['24px', { lineHeight: '32px', fontWeight: '600' }],
      },
    },
  },
  plugins: [],
}
