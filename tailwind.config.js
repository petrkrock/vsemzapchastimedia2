/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts}'],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#E8231A',
          'red-dark': '#C01812',
          'red-light': '#FF3B32',
          black: '#1A1A1A',
          gray: '#F5F5F5',
          'gray-mid': '#E0E0E0',
          'gray-dark': '#6B6B6B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.12)',
      }
    }
  },
  plugins: []
}
