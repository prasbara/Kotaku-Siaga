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
        // Municipal Civic Intelligence — Dark Mode Palette
        surface: '#0c1421',
        'surface-dim': '#0c1421',
        'surface-bright': '#323948',
        'surface-container-lowest': '#070e1b',
        'surface-container-low': '#141c29',
        'surface-container': '#18202d',
        'surface-container-high': '#222a38',
        'surface-container-highest': '#2d3543',
        'on-surface': '#dbe2f5',
        'on-surface-variant': '#bcc9cd',
        'inverse-surface': '#dbe2f5',
        'inverse-on-surface': '#29313f',
        outline: '#869397',
        'outline-variant': '#3d494c',
        'surface-tint': '#4cd7f6',

        // Brand Primaries
        primary: '#4cd7f6',
        'on-primary': '#003640',
        'primary-container': '#06b6d4',
        'on-primary-container': '#00424f',
        'inverse-primary': '#00687a',
        'primary-fixed': '#acedff',
        'primary-fixed-dim': '#4cd7f6',
        'on-primary-fixed': '#001f26',
        'on-primary-fixed-variant': '#004e5c',

        // Secondary (Green)
        secondary: '#4edea3',
        'on-secondary': '#003824',
        'secondary-container': '#00a572',
        'on-secondary-container': '#00311f',
        'secondary-fixed': '#6ffbbe',
        'secondary-fixed-dim': '#4edea3',
        'on-secondary-fixed': '#002113',
        'on-secondary-fixed-variant': '#005236',

        // Tertiary (Amber/Warning)
        tertiary: '#ffb95f',
        'on-tertiary': '#472a00',
        'tertiary-container': '#e79400',
        'on-tertiary-container': '#563400',
        'tertiary-fixed': '#ffddb8',
        'tertiary-fixed-dim': '#ffb95f',
        'on-tertiary-fixed': '#2a1700',
        'on-tertiary-fixed-variant': '#653e00',

        // Error / Critical
        error: '#ffb4ab',
        'on-error': '#690005',
        'error-container': '#93000a',
        'on-error-container': '#ffdad6',

        background: '#0c1421',
        'on-background': '#dbe2f5',
        'surface-variant': '#2d3543',

        // Semantic aliases for backward compatibility
        border: '#3d494c',
        input: '#18202d',
        ring: '#4cd7f6',
        foreground: '#dbe2f5',
        destructive: {
          DEFAULT: '#93000a',
          foreground: '#ffdad6',
        },
        muted: {
          DEFAULT: '#222a38',
          foreground: '#bcc9cd',
        },
        accent: {
          DEFAULT: '#18202d',
          foreground: '#dbe2f5',
        },
        popover: {
          DEFAULT: '#141c29',
          foreground: '#dbe2f5',
        },
        card: {
          DEFAULT: '#141c29',
          foreground: '#dbe2f5',
        },
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        none: '0px',
        sm: '0.125rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        full: '9999px',
      },
      fontFamily: {
        // Headline — Plus Jakarta Sans
        sans: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        // Body — Inter
        body: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        // Telemetry / Data — JetBrains Mono
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
        // Aliases
        headline: ['"Plus Jakarta Sans"', 'sans-serif'],
        telemetry: ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        'headline-xl': ['3rem', { lineHeight: '1.15', letterSpacing: '-0.025em', fontWeight: '700' }],
        'headline-xl-mobile': ['2rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-lg': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-lg-mobile': ['1.625rem', { lineHeight: '1.25', letterSpacing: '-0.015em', fontWeight: '700' }],
        'headline-md': ['1.5rem', { lineHeight: '1.3', letterSpacing: '-0.015em', fontWeight: '600' }],
        'headline-sm': ['1.125rem', { lineHeight: '1.35', letterSpacing: '-0.01em', fontWeight: '600' }],
        'body-lg': ['1rem', { lineHeight: '1.6', letterSpacing: '0em', fontWeight: '400' }],
        'body-md': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0em', fontWeight: '400' }],
        'body-sm': ['0.75rem', { lineHeight: '1.45', letterSpacing: '0.01em', fontWeight: '400' }],
        'metric-display': ['2.25rem', { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '600' }],
        'metric-display-mobile': ['1.75rem', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '600' }],
        'telemetry-data': ['0.875rem', { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '500' }],
        'label-caps': ['0.6875rem', { lineHeight: '1.2', letterSpacing: '0.08em', fontWeight: '600' }],
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0,0,0,0.4)',
        DEFAULT: '0 4px 12px rgba(0,0,0,0.4)',
        md: '0 8px 24px -4px rgba(3,7,18,0.45)',
        lg: '0 16px 32px -8px rgba(0,0,0,0.65)',
        'glow-primary': '0 0 16px rgba(76,215,246,0.2)',
        'glow-error': '0 0 16px rgba(239,68,68,0.25)',
        'glow-warning': '0 0 16px rgba(245,158,11,0.2)',
        none: 'none',
      },
      spacing: {
        'gutter': '1rem',
        'gutter-desktop': '1.5rem',
        'margin': '1rem',
        'margin-tablet': '1.5rem',
        'margin-desktop': '2rem',
        'space-xs': '0.25rem',
        'space-sm': '0.5rem',
        'space-md': '1rem',
        'space-lg': '1.5rem',
        'space-xl': '2.5rem',
      },
      animation: {
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      transitionDuration: {
        DEFAULT: '150ms',
        '200': '200ms',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-surface': 'linear-gradient(135deg, #0c1421 0%, #141c29 100%)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
