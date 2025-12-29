/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // Notion-inspired neutral palette
        bulk: {
          50: '#ffffff',
          100: '#fbfbfa',
          150: '#f7f6f3',
          200: '#edece9',
          300: '#e3e2de',
          400: '#9b9a97',
          500: '#787774',
          600: '#5a5955',
          700: '#37352f',
          800: '#2f2e2b',
          900: '#1f1f1e',
        },
        // Accent colors - Notion style muted tones
        accent: {
          blue: '#2383e2',
          'blue-light': '#e7f3ff',
          green: '#0f7b6c',
          'green-light': '#e6f4f1',
          orange: '#d9730d',
          'orange-light': '#fef3e5',
          red: '#e03e3e',
          'red-light': '#fce8e8',
          purple: '#6940a5',
          'purple-light': '#f3effc',
        },
      },
      // Flat design - no shadows
      boxShadow: {
        'none': 'none',
      },
      borderRadius: {
        'notion': '4px',
        'notion-lg': '8px',
      },
      fontSize: {
        'xxs': ['0.65rem', { lineHeight: '1rem' }],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.25s ease-out',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
}
