'use client';

import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import { LogoGrid } from '@vybekiit/ui/logo-grid';
import { useCallback, useState } from 'react';

const LOGOS = [
  {
    id: 'react',
    name: 'React',
    color: '#61DAFB',
    // biome-ignore lint/security/noSecrets: inline brand SVG markup, not a credential
    svg: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="2.5" fill="currentColor"/><ellipse cx="12" cy="12" rx="10" ry="4" stroke="currentColor" stroke-width="1.5"/><ellipse cx="12" cy="12" rx="10" ry="4" stroke="currentColor" stroke-width="1.5" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" stroke="currentColor" stroke-width="1.5" transform="rotate(120 12 12)"/></svg>',
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    color: '#3178C6',
    svg: '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="20" height="20" rx="2"/><path fill="white" d="M13.5 10H11v7H9.5v-7H7V8.5h6.5V10zm1.5 5.5c.3.4.8.7 1.4.7.7 0 1.1-.3 1.1-.8 0-.5-.3-.7-1-.9l-.5-.2c-1-.3-1.5-.8-1.5-1.7 0-1.1.9-1.8 2.1-1.8.8 0 1.4.3 1.8.8l-.9.9c-.2-.3-.6-.5-1-.5-.5 0-.8.2-.8.7 0 .4.3.6.9.8l.5.2c1.1.3 1.6.9 1.6 1.8 0 1.1-.9 1.9-2.3 1.9-.9 0-1.7-.4-2.1-1l1-.9z"/></svg>',
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    color: '#F38020',
    svg: '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M16.5 9.5C16.2 7 14.1 5 11.5 5 9.2 5 7.3 6.5 6.6 8.6 5.1 8.8 4 10.1 4 11.7c0 1.7 1.4 3 3 3h9c1.4 0 2.5-1.1 2.5-2.5 0-1.2-.9-2.3-2-2.7z"/></svg>',
  },
  {
    id: 'neon',
    name: 'Neon',
    color: '#00E599',
    svg: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 5h7.5L19 19h-7.5L3 5z" stroke="currentColor" stroke-width="1.5" fill="currentColor" fill-opacity="0.15"/><path d="M12.5 5H21v14l-4-5" stroke="currentColor" stroke-width="1.5"/></svg>',
  },
  {
    id: 'stripe',
    name: 'Stripe',
    color: '#635BFF',
    svg: '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M13.5 6.4c0-.9-.7-1.3-1.9-1.3-1.4 0-3.2.5-4.3 1.1l-.6-2.5C8 3.2 10 2.5 12.1 2.5c2.8 0 4.7 1.3 4.7 3.6 0 3.4-4.4 3.1-4.4 5.2h-2.8c0-2.5 3.9-2.4 3.9-4.9zm-2.2 7.5c1 0 1.8.8 1.8 1.9s-.8 1.9-1.8 1.9-1.8-.8-1.8-1.9.8-1.9 1.8-1.9z"/></svg>',
  },
  {
    id: 'vercel',
    name: 'Vercel',
    color: '#FFFFFF',
    svg: '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L22 20H2L12 2z"/></svg>',
  },
] as const;

/** All LogoGrid variants: read-only grid, selectable grid with state. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => {
    const [selected, setSelected] = useState<readonly string[]>(['react', 'cloudflare']);

    const handleSelect = useCallback((id: string) => {
      setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
    }, []);

    return (
      <div className="w-full max-w-xl space-y-8">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            read-only (selectable=false)
          </p>
          <LogoGrid logos={LOGOS} columns={3} />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            selectable — click to toggle
          </p>
          <LogoGrid
            logos={LOGOS}
            selectable={true}
            selected={selected}
            onSelect={handleSelect}
            columns={3}
          />
          <p className="text-xs text-muted-foreground">
            Selected: {selected.length === 0 ? 'none' : selected.join(', ')}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            2-column layout
          </p>
          <LogoGrid logos={LOGOS.slice(0, 4)} columns={2} />
        </div>
      </div>
    );
  },
};

export default story;
