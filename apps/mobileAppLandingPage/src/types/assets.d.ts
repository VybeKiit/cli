/**
 * Ambient declarations for non-code imports.
 *
 * Why this exists: our max-strict baseline turns on `noUncheckedSideEffectImports`,
 * so a side-effect import like `import './globals.css'` must resolve to a known
 * module or `tsc --noEmit` fails. Next.js compiles CSS at the bundler level and
 * ships no `*.css` type, and the generated `next-env.d.ts` is gitignored (absent in
 * a fresh CI checkout) — so we commit our own declaration to keep typecheck green.
 */
declare module '*.css';
