import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';
import animate from 'tailwindcss-animate';

/**
 * Surf Cafe PC Store — Design System
 * Paleta extraida del logo (rana tech + letras neon).
 */
const config: Config = {
  darkMode: ['class'],
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/config/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1.25rem', lg: '2rem' },
      screens: { '2xl': '1440px' },
    },
    extend: {
      colors: {
        /* ---- Marca Surf Cafe ---- */
        surf: {
          green: '#21E14B', // verde neon primario (logo)
          'green-bright': '#39FF14', // glow / hover
          'green-deep': '#0F7A2A', // sombras del degradado de la rana
          yellow: '#E6FF00', // amarillo neon secundario (tipografia SURF CAFE)
          cyan: '#00F0FF', // acento cyber (HUD, datos)
          magenta: '#FF00A8', // acento RGB (alertas / gradientes)
        },
        /* ---- Superficies ---- */
        surface: {
          DEFAULT: '#0A0D12', // fondo base
          deep: '#050508', // vacio / vignette
          metal: '#1A1F29', // cards, modales, HUD
          grey: '#2A2E35', // bordes, divisores, inputs
          light: '#3A4049', // hover de bordes
        },
        /* ---- Semanticos (CSS vars para shadcn/ui) ---- */
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
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Orbitron', 'sans-serif'],
        sans: ['var(--font-sans)', 'Chakra Petch', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        'neon-sm': '0 0 8px rgba(33, 225, 75, 0.35)',
        neon: '0 0 15px rgba(33, 225, 75, 0.30), inset 0 0 8px rgba(33, 225, 75, 0.08)',
        'neon-lg': '0 0 30px rgba(33, 225, 75, 0.45), 0 0 80px rgba(33, 225, 75, 0.15)',
        'neon-yellow': '0 0 15px rgba(230, 255, 0, 0.35)',
        'neon-cyan': '0 0 15px rgba(0, 240, 255, 0.35)',
        hud: '0 0 0 1px rgba(33, 225, 75, 0.22), 0 18px 40px -18px rgba(0, 0, 0, 0.9)',
      },
      dropShadow: {
        neon: ['0 0 6px rgba(33,225,75,0.65)', '0 0 18px rgba(33,225,75,0.35)'],
        'neon-yellow': ['0 0 6px rgba(230,255,0,0.65)', '0 0 18px rgba(230,255,0,0.30)'],
      },
      backgroundImage: {
        'grid-hud':
          'linear-gradient(rgba(33,225,75,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(33,225,75,0.06) 1px, transparent 1px)',
        'radial-glow':
          'radial-gradient(60% 50% at 50% 0%, rgba(33,225,75,0.18) 0%, rgba(10,13,18,0) 70%)',
        'rgb-sweep': 'linear-gradient(90deg, #21E14B 0%, #E6FF00 35%, #00F0FF 70%, #21E14B 100%)',
        scanline:
          'repeating-linear-gradient(180deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, transparent 1px, transparent 3px)',
      },
      backgroundSize: {
        'grid-hud': '48px 48px',
      },
      keyframes: {
        'neon-pulse': {
          '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
          '50%': { opacity: '0.75', filter: 'brightness(1.35)' },
        },
        flicker: {
          '0%, 19%, 21%, 23%, 25%, 54%, 56%, 100%': { opacity: '1' },
          '20%, 22%, 24%, 55%': { opacity: '0.35' },
        },
        'scan-down': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'rgb-shift': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'neon-pulse': 'neon-pulse 2.4s ease-in-out infinite',
        flicker: 'flicker 3.5s linear infinite',
        'scan-down': 'scan-down 4s linear infinite',
        'rgb-shift': 'rgb-shift 6s linear infinite',
        float: 'float 5s ease-in-out infinite',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [
    animate,
    /**
     * Utilidades propias: glow de texto, bordes neon y recortes HUD estilo ROG.
     */
    plugin(({ addUtilities, matchUtilities, theme }) => {
      addUtilities({
        /* --- Recortes angulares tipo HUD / ROG --- */
        '.clip-hud': {
          clipPath:
            'polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 18px 100%, 0 calc(100% - 18px))',
        },
        '.clip-hud-sm': {
          clipPath:
            'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
        },
        '.clip-blade': {
          clipPath: 'polygon(0 0, 100% 0, calc(100% - 22px) 100%, 0 100%)',
        },
        '.clip-tag': {
          clipPath: 'polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px)',
        },
        /* --- Superficie de cristal con borde luminoso --- */
        '.glass': {
          backgroundColor: 'rgba(26, 31, 41, 0.55)',
          backdropFilter: 'blur(14px) saturate(130%)',
          border: '1px solid rgba(33, 225, 75, 0.18)',
        },
        '.glass-strong': {
          backgroundColor: 'rgba(10, 13, 18, 0.82)',
          backdropFilter: 'blur(20px) saturate(140%)',
          border: '1px solid rgba(33, 225, 75, 0.25)',
        },
        /* --- Texto neon --- */
        '.text-glow': {
          textShadow: '0 0 8px rgba(33,225,75,0.75), 0 0 24px rgba(33,225,75,0.35)',
        },
        '.text-glow-yellow': {
          textShadow: '0 0 8px rgba(230,255,0,0.75), 0 0 24px rgba(230,255,0,0.30)',
        },
        '.text-gradient-rgb': {
          background: 'linear-gradient(90deg, #21E14B, #E6FF00, #00F0FF, #21E14B)',
          backgroundSize: '200% auto',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
        },
        /* --- Composicion 3D de tarjetas --- */
        '.preserve-3d': { transformStyle: 'preserve-3d' },
        '.perspective-1200': { perspective: '1200px' },
        '.backface-hidden': { backfaceVisibility: 'hidden' },
      });

      /* glow-<color> arbitrario: glow-surf-green, glow-surf-yellow, glow-[#ff0] */
      matchUtilities(
        {
          glow: (value) => ({
            boxShadow: `0 0 15px ${value}55, 0 0 45px ${value}22`,
          }),
          'glow-text': (value) => ({
            textShadow: `0 0 8px ${value}bb, 0 0 24px ${value}55`,
          }),
        },
        { values: flattenColors(theme('colors') as Record<string, unknown>), type: 'color' }
      );
    }),
  ],
};

/** Aplana el objeto de colores de Tailwind a `nombre-tono: valor`. */
function flattenColors(colors: Record<string, unknown>, prefix = ''): Record<string, string> {
  return Object.entries(colors).reduce<Record<string, string>>((acc, [key, value]) => {
    const name = prefix ? `${prefix}-${key}` : key;
    if (typeof value === 'string') {
      if (!value.startsWith('hsl(var')) acc[name] = value;
    } else if (value && typeof value === 'object') {
      Object.assign(acc, flattenColors(value as Record<string, unknown>, name));
    }
    return acc;
  }, {});
}

export default config;
