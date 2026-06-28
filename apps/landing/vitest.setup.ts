// Extends Vitest's `expect` with jest-dom matchers (toBeInTheDocument,
// toHaveAttribute, ...) for every test file. Imported via vitest's setupFiles.
import '@testing-library/jest-dom/vitest';

// jsdom ships no `matchMedia`, but components that respect `prefers-reduced-motion`
// call it on mount. Stub it to report "no preference" so those components render
// their animated branch under test exactly as a default browser would.
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
