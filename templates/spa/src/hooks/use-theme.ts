import { cssVariables } from '@vybekiit/tokens';
import { useEffect, useMemo, useState } from 'react';

type Scheme = 'light' | 'dark';

function readScheme(): Scheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Apply `@vybekiit/tokens` CSS variables from the OS color scheme. */
export function useTheme(): { scheme: Scheme } {
  const [scheme, setScheme] = useState<Scheme>(readScheme);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setScheme(media.matches ? 'dark' : 'light');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const vars = useMemo(() => cssVariables(scheme), [scheme]);

  useEffect(() => {
    const root = document.documentElement;
    for (const [key, value] of Object.entries(vars)) {
      root.style.setProperty(key, value);
    }
  }, [vars]);

  return { scheme };
}
