import type { Config } from 'tailwindcss';

/**
 * Tailwind config for the extension landing page (apps/extensionLandingPage).
 *
 * Mirrors `apps/landing/tailwind.config.ts`: color names map to the CSS
 * variables in `app/globals.css`, so shadcn-style components use semantic
 * classes (`bg-primary` / `text-muted-foreground`). The accent is overridden to
 * indigo in `app/globals.css`; this file only wires the color names to the vars.
 *
 * The `content` globs are extended to the reused `templates/web` component
 * registries (`deviceMockups`, `blocks`, `cult`, `untitled`, `ui`) so their
 * Tailwind classes are emitted when imported via `@vybekiit-template-web/*`.
 */
export default {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    '../../templates/web/src/components/deviceMockups/**/*.{ts,tsx}',
    '../../templates/web/src/components/blocks/**/*.{ts,tsx}',
    '../../templates/web/src/components/cult/**/*.{ts,tsx}',
    '../../templates/web/src/components/untitled/**/*.{ts,tsx}',
    '../../templates/web/src/components/ui/**/*.{ts,tsx}',
  ],
  theme: {
    container: { center: true, padding: '2rem', screens: { '2xl': '1400px' } },
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
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
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
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [],
} satisfies Config;
