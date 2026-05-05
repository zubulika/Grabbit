/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{js,jsx,html}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Core palette
        'gb-bg': '#0f0f0f',
        'gb-surface': '#181818',
        'gb-surface-light': '#212121',
        'gb-border': '#2a2a2a',
        'gb-text': '#ffffff',
        'gb-text-dim': '#aaaaaa',
        'gb-text-muted': '#717171',
        'gb-accent': '#ff0000',
        'gb-accent-hover': '#cc0000',
        'gb-accent-soft': 'rgba(255, 0, 0, 0.1)',
        'gb-success': '#00c853',
        'gb-error': '#ff3d3d',
        'gb-warning': '#ffab00'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      },
      borderRadius: {
        'gb': '10px',
        'gb-sm': '6px',
        'gb-lg': '14px'
      },
      boxShadow: {
        'gb': '0 4px 24px rgba(0, 0, 0, 0.4)',
        'gb-lg': '0 8px 40px rgba(0, 0, 0, 0.6)'
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'slide-up': 'slideUp 0.4s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out'
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        }
      }
    }
  },
  plugins: []
}
