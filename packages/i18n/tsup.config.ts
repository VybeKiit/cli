import { defineConfig } from 'tsup';

/** Dual entry: full provider (Node) + browser-safe locale rules. */
export default defineConfig({
  // camelCase src file, but keep the public dist name `locale-rules` (subpath export @vybekiit/i18n/locale-rules)
  entry: { index: 'src/index.ts', 'locale-rules': 'src/localeRules.ts' },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
});
