import type { Config } from 'tailwindcss';

/**
 * Tailwind config for the VybeKiit store (apps/landing).
 *
 * Mirrors `templates/web/tailwind.config.ts`: the color names map to the CSS
 * variables in `app/globals.css`, so shadcn-style components use semantic classes
 * (`bg-primary` / `text-muted-foreground`). Dark mode is class-based (`html.dark`)
 * so the navbar theme toggle can switch without following the OS.
 *
 * RTL is handled by CSS *logical properties* (`ms-`/`me-`/`ps-`/`pe-` and
 * `start-`/`end-`, never `ml-`/`mr-`/`left-`/`right-`), so the layout mirrors
 * automatically when `<html dir="rtl">` is set — see the root layout's direction
 * detection. Copy stays English; the structure stays RTL-safe.
 */
export default {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    '../../templates/web/src/components/ai-elements/**/*.{ts,tsx}',
    '../../templates/web/src/components/builder-assistant-mark/**/*.{ts,tsx}',
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
    },
  },
  plugins: [],
} satisfies Config;
