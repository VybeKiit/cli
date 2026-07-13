import type { Config } from 'tailwindcss';

/**
 * Tailwind config for the mobile-app landing page (apps/mobileAppLandingPage).
 *
 * Mirrors `apps/landing/tailwind.config.ts`: color names map to the CSS variables
 * in `app/globals.css`, so shadcn-style components style with semantic classes
 * (`bg-primary` / `text-muted-foreground`). The accent token is overridden to blue
 * in `globals.css`, so every `bg-primary` / `text-primary` reads blue automatically.
 *
 * The `content` globs also cover the `templates/web` component dirs this app imports
 * from (device mockups, 21st blocks, cult, untitled, ui) so Tailwind emits the
 * classes those reused components rely on.
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
    },
  },
  plugins: [],
} satisfies Config;
