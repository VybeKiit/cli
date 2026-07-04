import type { Config } from 'tailwindcss';

/**
 * Tailwind config for a VybeKiit web app.
 *
 * The color names below map to the CSS variables in `app/globals.css`, which is
 * what lets shadcn/ui components (added with `npx shadcn add`) style themselves
 * with semantic classes like `bg-primary` / `text-muted-foreground`. Dark mode
 * follows the visitor's OS preference (a `@media` query in globals.css), so there
 * is no theme-toggle to wire — keep it that way unless the builder asks for one.
 *
 * RTL is handled by CSS *logical properties* (use `ms-`/`me-`/`ps-`/`pe-` and
 * `start-`/`end-` utilities, never `ml-`/`mr-`/`left-`/`right-`), so Hebrew/Arabic
 * layouts mirror automatically when `<html dir="rtl">` is set — no per-component
 * RTL code. See `language.md` and the root layout's direction detection.
 */
export default {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
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
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(calc(-100% - var(--gap, 1rem)))' },
        },
        'marquee-vertical': {
          from: { transform: 'translateY(0)' },
          to: { transform: 'translateY(calc(-100% - var(--gap, 1rem)))' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        marquee: 'marquee var(--duration, 40s) linear infinite',
        'marquee-vertical': 'marquee-vertical var(--duration, 40s) linear infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
