/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // Core palette
        void: '#07080A',
        'void-80': 'rgba(7,8,10,0.80)',
        surface: '#0D1016',
        'surface-2': '#111520',
        ice: '#F5F8FA',
        'ice-2': '#ECF2F6',
        'cool-white': '#E6EDF4',
        // Atmosphere
        atmo: {
          blue: '#1060D8',
          cyan: '#12C8E0',
          sky: '#50D8E8',
          frost: '#E8FAFC',
        },
        // Accent
        accent: {
          blue: '#4DA8F5',
          cyan: '#1ECFE0',
          'cyan-dim': 'rgba(30,207,224,0.15)',
          'blue-dim': 'rgba(77,168,245,0.12)',
        },
        // Text
        ink: {
          primary: '#18202A',
          secondary: '#6B7885',
          muted: '#95A2AE',
          ghost: '#B8C4CC',
        },
        // Emergency
        emergency: {
          DEFAULT: '#BE2418',
          dim: 'rgba(190,36,24,0.10)',
          border: 'rgba(190,36,24,0.22)',
        },
        // Status
        ok: '#12B870',
        warn: '#CC7A08',

        // Glass material tokens exposed as colors for inline use
        'glass-white': 'rgba(255,255,255,0.62)',
        'glass-dark': 'rgba(12,16,22,0.72)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
        '6xl': '3rem',
        '7xl': '3.5rem',
      },
      fontSize: {
        'display-2xl': ['clamp(3.25rem, 7vw, 7.5rem)', { lineHeight: '0.93', letterSpacing: '-0.04em' }],
        'display-xl': ['clamp(2.5rem, 5.5vw, 6rem)', { lineHeight: '0.95', letterSpacing: '-0.035em' }],
        'display-lg': ['clamp(2rem, 4vw, 4.5rem)', { lineHeight: '0.97', letterSpacing: '-0.03em' }],
        'display-md': ['clamp(1.5rem, 3vw, 3rem)', { lineHeight: '1', letterSpacing: '-0.025em' }],
        'label': ['0.6875rem', { lineHeight: '1', letterSpacing: '0.12em' }],
        'label-lg': ['0.75rem', { lineHeight: '1', letterSpacing: '0.1em' }],
      },
      boxShadow: {
        // Atmospheric glow
        'atmo': '0 0 120px -20px rgba(16,96,216,0.18)',
        // Glass material shadows
        'glass': '0 8px 32px -4px rgba(16,96,216,0.10), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.95)',
        'glass-dark': '0 8px 40px -8px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.09)',
        'glass-hover': '0 12px 48px -6px rgba(16,96,216,0.14), 0 3px 12px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,1)',
        // Legacy
        'panel': '0 2px 40px -8px rgba(7,8,10,0.28), 0 0 0 1px rgba(255,255,255,0.90)',
        'card': '0 1px 3px rgba(7,8,10,0.06), inset 0 1px 0 rgba(255,255,255,0.80)',
        'card-hover': '0 12px 40px -8px rgba(7,8,10,0.12), 0 4px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.90)',
        'glow-cyan': '0 0 40px -8px rgba(30,207,224,0.35)',
        'glow-blue': '0 0 60px -10px rgba(16,96,216,0.25)',
      },
      backgroundImage: {
        'atmo-gradient': 'radial-gradient(ellipse 80% 60% at 50% -10%, #50D8E826, transparent), radial-gradient(ellipse 60% 80% at 90% 50%, #1060D818, transparent), radial-gradient(ellipse 50% 60% at 10% 80%, #12C8E012, transparent)',
        'atmo-hero': 'radial-gradient(ellipse 100% 70% at 60% 0%, #12C8E022, transparent 70%), radial-gradient(ellipse 80% 80% at 0% 100%, #1060D814, transparent)',
        'surface-gradient': 'linear-gradient(180deg, #0D1016 0%, #070810 100%)',
        // Liquid glass sheen — applied via JS for dynamic shimmer
        'glass-sheen': 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.35) 50%, transparent 60%)',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.032'/%3E%3C/svg%3E\")",
      },
      animation: {
        // Existing
        'anatomy-float': 'anatomyFloat 8s ease-in-out infinite',
        'line-draw': 'lineDraw 1.5s ease-out forwards',
        'fade-up': 'fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) forwards',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
        'scan': 'scan 3s linear infinite',
        // New fluid motion
        'drift-up': 'driftUp 0.5s cubic-bezier(0.22,1,0.36,1) both',
        'scale-in': 'scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'liquid-sheen': 'liquidSheen 2.5s linear infinite',
      },
      keyframes: {
        anatomyFloat: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-16px) rotate(0.8deg)' },
        },
        lineDraw: {
          from: { strokeDashoffset: '1000' },
          to: { strokeDashoffset: '0' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        driftUp: {
          from: { opacity: '0', transform: 'translateY(36px) scale(0.98)', filter: 'blur(4px)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)', filter: 'blur(0px)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.94) translateY(12px)', filter: 'blur(3px)' },
          to: { opacity: '1', transform: 'scale(1) translateY(0)', filter: 'blur(0)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.35', transform: 'scale(0.8)' },
        },
        scan: {
          from: { transform: 'translateY(-100%)' },
          to: { transform: 'translateY(100vh)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px -4px rgba(30,207,224,0.25)' },
          '50%': { boxShadow: '0 0 36px -4px rgba(30,207,224,0.50)' },
        },
        liquidSheen: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'fluid': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        'fast': '160ms',
        'mid': '280ms',
        'slow': '500ms',
        'drift': '800ms',
      },
      backdropBlur: {
        'xs': '4px',
        'glass': '28px',
        'glass-md': '32px',
        'glass-lg': '48px',
      },
    },
  },
  plugins: [],
}
