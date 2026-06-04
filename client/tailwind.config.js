/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // === Warm premium cafe palette (cream + nâu + vàng đồng) ===
        cafe: {
          espresso: '#1A0A00',
          brown: '#5C3317',
          'brown-light': '#8B5E3C',
          gold: '#C8922A',
          'gold-hover': '#A0721A',
          'gold-light': '#E8B84B',
          'gold-soft': '#FEF3DC',
          cream: '#F5EDE0',
          'cream-dark': '#EDE0CC',
          card: '#FFFAF4',
          text: '#1A0A00',
          body: '#3D2B1F',
          muted: '#7A6355',
          border: '#E8D5BC',
        },

        // page & surfaces
        page: '#F5EDE0',
        'page-alt': '#EDE0CC',
        surface: '#FFFAF4',
        'surface-alt': '#EDE0CC',

        // primary action (vàng đồng) — bg-primary / text-primary
        primary: {
          DEFAULT: '#C8922A',
          hover: '#A0721A',
          light: '#FEF3DC',
          dark: '#A0721A',
          bright: '#E8B84B',
        },

        // brown accents
        brown: {
          DEFAULT: '#5C3317',
          light: '#8B5E3C',
        },

        // sidebar / dark surfaces
        sidebar: '#1A0A00',
        'sidebar-active': '#3D2410',
        'sidebar-border': '#C8922A',
        'sidebar-card': '#120700',
        'sidebar-text': '#C4A882',

        // legacy accent-green aliases now mapped to gold (used across components)
        accent: {
          green: '#C8922A',
          'green-dark': '#A0721A',
          'green-light': '#FEF3DC',
        },

        // muted -> hovers / alt rows / icon wells (warm cream)
        muted: '#EFE2CF',

        // text
        text: {
          primary: '#1A0A00',
          body: '#3D2B1F',
          muted: '#7A6355',
        },
        heading: '#1A0A00',
        body: '#3D2B1F',

        brdr: '#E8D5BC',
        'brdr-light': '#F3E8D8',

        danger: '#C0392B',
        'danger-light': '#FFEBEE',
        warning: '#E65100',
        'warning-light': '#FBE9E7',
        success: '#4A8C5C',
        'success-light': '#E8F5E9',
        info: '#1565C0',
        'info-light': '#E3F2FD',
      },
      fontFamily: {
        sans: ['Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      fontSize: {
        base: '14px',
      },
      borderColor: {
        DEFAULT: '#E8D5BC',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-468px 0' },
          '100%': { backgroundPosition: '468px 0' },
        },
        'toast-in': {
          '0%': { opacity: '0', transform: 'translateX(120%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-left': {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'dot-pulse': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.7)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'scale-in': 'scale-in 200ms ease-out',
        'slide-up': 'slide-up 250ms ease-out',
        shimmer: 'shimmer 1.4s linear infinite',
        'toast-in': 'toast-in 250ms ease-out',
        float: 'float 6s ease-in-out infinite',
        'fade-up': 'fade-up 0.5s ease forwards',
        'slide-left': 'slide-left 0.4s ease forwards',
        'dot-pulse': 'dot-pulse 2s ease-in-out infinite',
      },
      boxShadow: {
        card: '0 4px 20px rgba(26,10,0,0.10)',
        hover: '0 12px 36px rgba(26,10,0,0.18)',
      },
    },
  },
  plugins: [],
};
