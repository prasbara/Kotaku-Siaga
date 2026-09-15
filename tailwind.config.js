/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "24px",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // KotaKu Siaga — Slacc-inspired Editorial System
        // Brand Primaries
        primary: {
          DEFAULT: '#4a154b',
          deep: '#481a54',
          press: '#611f69',
          tint: '#592466',
          foreground: '#ffffff',
        },
        // Surfaces & Backgrounds
        cream: {
          DEFAULT: '#f4ede4',
          light: '#fbf8f5',
          dark: '#e8ded2',
        },
        lavender: {
          DEFAULT: '#f9f0ff',
          light: '#fdf9ff',
          dark: '#eddcf7',
        },
        surface: {
          DEFAULT: '#ffffff',
          cream: '#f4ede4',
          lavender: '#f9f0ff',
          dark: '#4a154b',
        },
        'surface-container': '#f4ede4',
        'surface-container-low': '#ffffff',
        'surface-container-lowest': '#ffffff',
        'surface-container-high': '#ebdccb',
        'surface-container-highest': '#e0cebc',
        'on-surface': '#1d1d1d',
        'on-surface-variant': '#696969',
        'outline-variant': '#e6e6e6',
        'primary-container': '#f9f0ff',
        'on-primary-container': '#4a154b',
        'on-primary': '#ffffff',
        // Typography & Neutrals
        ink: {
          DEFAULT: '#1d1d1d',
          light: '#2d2d2d',
        },
        muted: {
          DEFAULT: '#696969',
          foreground: '#696969',
          aubergine: '#d9bdde',
        },
        // Interactive & Accents
        link: {
          DEFAULT: '#1264a3',
          hover: '#3860be',
        },
        border: {
          DEFAULT: '#e6e6e6',
          subtle: '#f0f0f0',
          dark: '#3d163e',
        },
        // Status Colors
        error: {
          DEFAULT: '#cc4117',
          foreground: '#ffffff',
          subtle: '#fdf0ec',
        },
        success: {
          DEFAULT: '#007a5a',
          foreground: '#ffffff',
          subtle: '#ebf7f3',
        },
        warning: {
          DEFAULT: '#d97706',
          foreground: '#ffffff',
          subtle: '#fef3c7',
        },
        // Semantic aliases for shadcn-style compatibility
        background: '#ffffff',
        foreground: '#1d1d1d',
        card: {
          DEFAULT: '#ffffff',
          foreground: '#1d1d1d',
        },
        popover: {
          DEFAULT: '#ffffff',
          foreground: '#1d1d1d',
        },
        secondary: {
          DEFAULT: '#f9f0ff',
          foreground: '#1d1d1d',
        },
        destructive: {
          DEFAULT: '#cc4117',
          foreground: '#ffffff',
        },
        input: '#e6e6e6',
        ring: '#4a154b',
      },
      borderRadius: {
        none: '0px',
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
        '3xl': '48px',
        pill: '90px',
        full: '9999px',
        DEFAULT: '16px',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        body: ['var(--font-inter)', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['var(--font-inter)', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['var(--font-mono)', '"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
      },
      fontSize: {
        'display': ['64px', { lineHeight: '1.12', letterSpacing: '-0.768px', fontWeight: '700' }],
        'display-xl': ['58px', { lineHeight: '1.25', letterSpacing: '-0.464px', fontWeight: '600' }],
        'display-lg': ['50px', { lineHeight: '1.12', letterSpacing: '-0.6px', fontWeight: '700' }],
        'display-md': ['32px', { lineHeight: '1.25', letterSpacing: '-0.256px', fontWeight: '700' }],
        'heading-lg': ['24px', { lineHeight: '1.3', letterSpacing: '-0.02em', fontWeight: '700' }],
        'heading-md': ['22px', { lineHeight: '1.35', letterSpacing: '-0.015em', fontWeight: '600' }],
        'heading-sm': ['18px', { lineHeight: '1.4', letterSpacing: '-0.01em', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '1.55', letterSpacing: '0em', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '1.55', letterSpacing: '0em', fontWeight: '400' }],
        'body-md-bold': ['16px', { lineHeight: '1.5', letterSpacing: '0em', fontWeight: '700' }],
        'body-sm': ['14px', { lineHeight: '1.43', letterSpacing: '0.005em', fontWeight: '400' }],
        'body-xs-bold': ['12px', { lineHeight: '1.4', letterSpacing: '0.02em', fontWeight: '700' }],
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '7': '28px',
        '8': '32px',
        '12': '48px',
        '16': '64px',
        '24': '96px',
      },
      boxShadow: {
        subtle: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        card: '0 4px 16px -2px rgba(74, 21, 75, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        dropdown: '0 10px 30px -5px rgba(74, 21, 75, 0.12)',
        cta: '0 4px 14px rgba(74, 21, 75, 0.25)',
      },
      backgroundImage: {
        'pastel-mesh': 'radial-gradient(at 10% 20%, rgba(244, 237, 228, 0.9) 0px, transparent 50%), radial-gradient(at 90% 10%, rgba(249, 240, 255, 0.9) 0px, transparent 50%), radial-gradient(at 80% 80%, rgba(254, 237, 222, 0.7) 0px, transparent 50%), radial-gradient(at 20% 90%, rgba(235, 247, 243, 0.7) 0px, transparent 50%)',
        'pastel-hero': 'radial-gradient(ellipse at top right, rgba(249, 240, 255, 0.85) 0%, transparent 60%), radial-gradient(ellipse at bottom left, rgba(244, 237, 228, 0.9) 0%, transparent 60%), radial-gradient(circle at 50% 50%, #ffffff 0%, #fdfbf9 100%)',
        'aubergine-mesh': 'radial-gradient(circle at top right, #592466 0%, #4a154b 60%, #3b0f3c 100%)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
