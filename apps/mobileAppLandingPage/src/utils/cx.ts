/**
 * `cx` shim so reused `templates/web` components (e.g. the app-store buttons) that
 * import `@/utils/cx` resolve during `tsc`. Aliases `cn` from `cnfast`.
 */
export { cn as cx } from 'cnfast';
