/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Aurora Theme Colors
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        secondary: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
        },
        accent: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        },
        aurora: {
          light: '#f0f9ff',
          DEFAULT: '#0F0F23',
          dark: '#0a0a1a',
          card: 'rgba(30, 30, 60, 0.6)',
          'card-light': 'rgba(255, 255, 255, 0.7)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      },
      backgroundImage: {
        'aurora-gradient': 'linear-gradient(135deg, #6366F1, #8B5CF6, #EC4899)',
        'aurora-gradient-soft': 'linear-gradient(135deg, #818CF8, #A78BFA, #F472B6)',
        'aurora-mesh-light': 'radial-gradient(circle at 30% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(236, 72, 153, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 30%, rgba(34, 211, 238, 0.1) 0%, transparent 40%)',
        'aurora-mesh-dark': 'radial-gradient(circle at 30% 20%, rgba(99, 102, 241, 0.2) 0%, transparent 40%), radial-gradient(circle at 70% 80%, rgba(236, 72, 153, 0.15) 0%, transparent 40%), radial-gradient(circle at 80% 30%, rgba(34, 211, 238, 0.15) 0%, transparent 30%)',
      },
      boxShadow: {
        'aurora': '0 4px 20px rgba(99, 102, 241, 0.3)',
        'aurora-lg': '0 8px 30px rgba(99, 102, 241, 0.4)',
        'aurora-pink': '0 4px 20px rgba(236, 72, 153, 0.3)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.1)',
        'glass-dark': '0 8px 32px rgba(0, 0, 0, 0.3)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'gradient': 'gradient 8s ease infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
}
