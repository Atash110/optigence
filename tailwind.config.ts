import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Custom Background Colors
        background: {
          light: '#F9FAFB',
          dark: '#020617',
        },
        // Custom Foreground Colors
        foreground: {
          light: '#0F172A',
          dark: '#E2E8F0',
        },
        // Custom Primary Colors
        primary: {
          light: '#2563EB',
          dark: '#3B82F6',
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        // Custom Card Colors
        card: {
          light: '#FFFFFF',
          dark: '#0F172A',
        },
        // Custom Border Colors
        border: {
          light: '#E5E7EB',
          dark: '#1E293B',
        },
        // Custom Accent Colors
        accent: {
          light: '#E0F2FE',
          dark: '#60A5FA',
        },
        // Enhanced Navy palette for additional styling
        navy: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#0d1b2a', // Your dark background
        },
        // Additional semantic colors for better UX
        success: {
          light: '#16a34a',
          dark: '#22c55e',
        },
        warning: {
          light: '#ca8a04',
          dark: '#eab308',
        },
        error: {
          light: '#dc2626',
          dark: '#ef4444',
        },
        info: {
          light: '#0ea5e9',
          dark: '#38bdf8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Geist', 'system-ui', 'sans-serif'],
        display: ['Inter', 'Geist', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounceSubtle 2s infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(-5%)' },
          '50%': { transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
