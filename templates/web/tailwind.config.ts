import type { Config } from 'tailwindcss';

/**
 * Tailwind config for a VybeKiit web app.
 *
 * RTL is handled by CSS *logical properties* (use `ms-`/`me-`/`ps-`/`pe-` and
 * `start-`/`end-` utilities, never `ml-`/`mr-`/`left-`/`right-`), so Hebrew/Arabic
 * layouts mirror automatically when `<html dir="rtl">` is set — no per-component
 * RTL code. See `language.md` and the root layout's direction detection.
 */
export default {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;
