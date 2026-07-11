// Extends Vitest's `expect` with jest-dom matchers (toBeInTheDocument, …).
import '@testing-library/jest-dom/vitest';

// jsdom ships no `matchMedia`; components that respect reduced-motion call it on mount.
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
