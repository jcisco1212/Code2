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
        // YouTube-style Colors
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#FF0000', // YouTube red
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        secondary: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
        },
        accent: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        // YouTube dark mode colors
        yt: {
          bg: '#0f0f0f',
          'bg-secondary': '#181818',
          'bg-elevated': '#212121',
          'bg-hover': '#272727',
          border: '#303030',
          text: '#f1f1f1',
          'text-secondary': '#aaaaaa',
          red: '#FF0000',
        }
      },
      fontFamily: {
        sans: ['Roboto', 'Inter', 'system-ui', '-apple-system', 'sans-serif']
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #FF0000, #cc0000)',
        'gradient-dark': 'linear-gradient(180deg, #0f0f0f 0%, #181818 100%)',
      },
      boxShadow: {
        'yt': '0 1px 2px rgba(0, 0, 0, 0.3)',
        'yt-lg': '0 4px 12px rgba(0, 0, 0, 0.4)',
        'yt-hover': '0 4px 16px rgba(0, 0, 0, 0.5)',
      },
      borderRadius: {
        'yt': '12px',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
}
