/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // === Café warm palette ===
        cafe: {
          espresso: '#2C1A0E',
          brown: '#3D2410',
          gold: '#C8922A',
          'gold-hover': '#A87520',
          'gold-light': '#FEF3DC',
          cream: '#FDF8F3',
          warm: '#FEF6EC',
          text: '#1A0F00',
          body: '#4A3728',
          muted: '#9C8472',
          border: '#E8D5BC',
        },

        // page & surfaces
        page: '#FDF8F3',
        surface: '#FFFFFF',
        'surface-alt': '#FEF6EC',

        // primary action (gold-brown) — bg-primary / text-primary
        primary: {
          DEFAULT: '#C8922A',
          hover: '#A87520',
          light: '#FEF3DC',
          dark: '#8B6020',
        },

        // sidebar
        sidebar: '#2C1A0E',
        'sidebar-active': '#3D2410',
        'sidebar-border': '#C8922A',
        'sidebar-card': '#1A0A02',
        'sidebar-text': '#C4A882',

        // legacy accent-green aliases now mapped to gold (used across components)
        accent: {
          green: '#C8922A',
          'green-dark': '#A87520',
          'green-light': '#FEF3DC',
        },

        // muted -> table headers / hovers / alt rows (warm)
        muted: '#FEF6EC',

        // text
        text: {
          primary: '#1A0F00',
          body: '#4A3728',
          muted: '#9C8472',
        },
        heading: '#1A0F00',
        body: '#4A3728',

        brdr: '#E8D5BC',
        'brdr-light': '#F3E8D8',

        danger: '#C62828',
        'danger-light': '#FFEBEE',
        warning: '#E65100',
        'warning-light': '#FBE9E7',
        success: '#2E7D32',
        'success-light': '#E8F5E9',
        info: '#1565C0',
        'info-light': '#E3F2FD',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
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
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'scale-in': 'scale-in 200ms ease-out',
        'slide-up': 'slide-up 250ms ease-out',
        shimmer: 'shimmer 1.4s linear infinite',
        'toast-in': 'toast-in 250ms ease-out',
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
