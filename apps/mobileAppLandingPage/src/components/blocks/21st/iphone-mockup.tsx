/**
 * Shim so the reused `templates/web` device-mockup wrapper resolves its internal
 * `@/components/blocks/21st/iphone-mockup` import during `tsc` in this app (the app
 * tsconfig maps `@/*` → `./src/*`). Re-exports the real 21st primitive from
 * `templates/web` — no logic is duplicated here.
 */
export {
  IPhoneMockup,
  type IPhoneMockupProps,
} from '@vybekiit-template-web/components/blocks/21st/iphone-mockup';
