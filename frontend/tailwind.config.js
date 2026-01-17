/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Enable class-based dark mode
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Professional Palette
        'brand-dark': '#1F3D33',
        'brand-dark-hover': '#162B24',
        'brand-cream': '#F3F1E6',
        'brand-mint': '#E1E6E3',
        'brand-text': '#1F3D33',
        'brand-gray': '#9CA3AF',

        // Keep existing for backward compat where needed, but mapped to new palette where possible
        'duo-bg': '#F3F1E6',
        'duo-surface': '#FFFFFF',
        'duo-green': '#1F3D33',

        // Keep existing primary colors for backward compatibility
        primary: {
          50: '#F3F1E6',
          100: '#E1E6E3',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#1F3D33', // Main brand color
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#1F3D33',
        },
        // Brand colors (old, kept for reference/backward compatibility)
        'duo-green-hover': '#61D800',
        'duo-green-shadow': '#46A302',
        'duo-green-light': '#89E219',

        'duo-blue': '#1CB0F6',
        'duo-blue-hover': '#14B8FF',
        'duo-blue-shadow': '#1899D6',
        'duo-blue-tint': '#DDF4FF',

        'duo-purple': '#8549BA',
        'duo-purple-light': '#CE82FF',
        'duo-purple-tint': '#F3E5FF',

        'duo-red': '#FF4B4B',
        'duo-red-dark': '#EA2B2B',
        'duo-red-tint': '#FFDFE0',

        'duo-yellow': '#FFC800',
        'duo-orange': '#FF9600',

        // Text
        'duo-text': '#4B4B4B',
        'duo-text-muted': '#737373',
        'duo-text-subtle': '#AFAFAF',

        // Borders
        'duo-border': '#E5E5E5',
        'duo-border-focus': '#84D8FF',
      },
      fontFamily: {
        serif: ['Playfair Display', 'serif'],
        sans: ['Space Grotesk', 'Inter', 'sans-serif'],
        'duo': ['Space Grotesk', 'sans-serif'],
        jakarta: ['Inter', 'sans-serif'],
      },
      fontSize: {
        'xs': ['12px', { lineHeight: '18px' }],
        'sm': ['14px', { lineHeight: '20px' }],
        'base': ['16px', { lineHeight: '24px' }],
        'lg': ['18px', { lineHeight: '28px' }],
        'xl': ['20px', { lineHeight: '30px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['30px', { lineHeight: '36px' }],
        '4xl': ['36px', { lineHeight: '44px' }],
        '5xl': ['48px', { lineHeight: '1.1' }],
        '6xl': ['60px', { lineHeight: '1.1' }],
        '7xl': ['72px', { lineHeight: '1.1' }],
        'duo-xs': ['12px', { lineHeight: '18px' }],
        'duo-sm': ['13px', { lineHeight: '20px' }],
        'duo-base': ['15px', { lineHeight: '24px' }],
        'duo-md': ['16px', { lineHeight: '24px' }],
        'duo-lg': ['17px', { lineHeight: '24px' }],
        'duo-xl': ['19px', { lineHeight: '28px' }],
        'duo-2xl': ['23px', { lineHeight: '32px' }],
        'duo-3xl': ['25px', { lineHeight: '32px' }],
        'duo-4xl': ['32px', { lineHeight: '40px' }],
      },
      spacing: {
        'duo-1': '4px',
        'duo-2': '8px',
        'duo-3': '12px',
        'duo-4': '16px',
        'duo-5': '20px',
        'duo-6': '24px',
        'duo-8': '32px',
        'duo-10': '40px',
        'duo-12': '48px',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        'duo-sm': '8px',
        'duo-md': '12px',
        'duo-lg': '16px',
        'duo-xl': '20px',
        'duo-2xl': '24px',
      },
      boxShadow: {
        'duo-green': '0 4px 0 #46A302',
        'duo-green-lg': '0 5px 0 #46A302',
        'duo-blue': '0 4px 0 #1899D6',
        'duo-gray': '0 4px 0 #E5E5E5',
        'duo-red': '0 4px 0 #EA2B2B',
        'duo-card': '0 2px 10px rgba(0, 0, 0, 0.08)',
      },
      animation: {
        'shake': 'shake 0.5s ease-in-out',
        'bounce-in': 'bounceIn 0.5s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'pulse-success': 'pulseSuccess 0.6s ease-out',
        'flame': 'flame 1s ease-in-out infinite',
        'blob': 'blob 7s infinite',
        'scroll': 'scroll 30s linear infinite',
      },
      keyframes: {
        blob: {
          "0%": {
            transform: "translate(0px, 0px) scale(1)",
          },
          "33%": {
            transform: "translate(30px, -50px) scale(1.1)",
          },
          "66%": {
            transform: "translate(-20px, 20px) scale(0.9)",
          },
          "100%": {
            transform: "translate(0px, 0px) scale(1)",
          },
        },
        scroll: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulseSuccess: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)' },
        },
        flame: {
          '0%, 100%': { transform: 'scale(1) rotate(0deg)' },
          '25%': { transform: 'scale(1.1) rotate(-5deg)' },
          '75%': { transform: 'scale(1.1) rotate(5deg)' },
        },
      },
    },
  },
  plugins: [],
};
