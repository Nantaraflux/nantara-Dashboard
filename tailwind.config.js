/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#FAFBFC',
          surface: '#FFFFFF',
          elevated: '#F5F7FA',
          hover: '#EEF1F6',
        },
        border: {
          DEFAULT: '#E2E8F0',
          light: '#F1F5F9',
        },
        accent: {
          primary: '#6366F1',
          secondary: '#8B5CF6',
          light: '#C7D2FE',
        },
        txt: {
          primary: '#1E293B',
          secondary: '#64748B',
          tertiary: '#94A3B8',
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#06B6D4',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        label: ['12px', { lineHeight: '16px', fontWeight: '600', letterSpacing: '0.5px' }],
        metric: ['32px', { lineHeight: '40px', fontWeight: '700' }],
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [],
}
