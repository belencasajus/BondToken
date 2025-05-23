/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#EEF2F7',
          100: '#D3DEF0',
          200: '#A6BEDE',
          300: '#759ECF',
          400: '#4D7EBF',
          500: '#2E5FA0',
          600: '#0A2647', 
          700: '#081F3D',
          800: '#061833',
          900: '#041229'
        },
        secondary: {
          50: '#F9FAFA',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
        accent: {
          gold: '#FFD700',
          blue: '#3B82F6',
        },
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
      },
      boxShadow: {
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      },
      spacing: {
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
      transitionProperty: {
        'height': 'height',
      },
    },
  },
  plugins: [],
};