'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const SNIPPETS = [
  { lang: 'tsx', code: 'export const App = () => {\n  return <Layout>...</Layout>;\n};' },
  { lang: 'ts', code: `import { drizzle } from 'drizzle-orm';\nconst db = drizzle(pool);` },
  { lang: 'json', code: `{\n  "name": "my-saas",\n  "scripts": { "dev": "next dev" }\n}` },
  { lang: 'ts', code: 'export const auth = betterAuth({\n  providers: [google()],\n});' },
  { lang: 'tsx', code: '<Button onClick={submit}>\n  Get Started →\n</Button>' },
  { lang: 'ts', code: 'const schema = z.object({\n  email: z.string().email(),\n});' },
  { lang: 'bash', code: 'pnpm create next-app@latest\npnpm add drizzle-orm zustand' },
  { lang: 'ts', code: `export default defineConfig({\n  compatibilityDate: '2025-01-01',\n});` },
];

type CodeSnippetsProps = {
  active: boolean;
};

/**
 * Render the code snippets component.
 *
 * @param active - Whether the animated snippet strip should render.
 * @returns A React element for the local dev Console UI.
 * @example
 * const element = <CodeSnippets active={true} />;
 */
export const CodeSnippets = ({ active }: CodeSnippetsProps) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % SNIPPETS.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [active]);

  const snippet = SNIPPETS[index];
  if (!(snippet && active)) return null;

  return (
    <div className="mt-2 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
      <div className="flex items-center gap-2 border-b border-zinc-800/50 px-3 py-1">
        <div className="flex gap-1">
          <div className="h-2 w-2 rounded-full bg-red-500/60" />
          <div className="h-2 w-2 rounded-full bg-yellow-500/60" />
          <div className="h-2 w-2 rounded-full bg-green-500/60" />
        </div>
        <span className="text-xs font-mono text-zinc-500">{snippet.lang}</span>
      </div>
      <pre
        className={cn(
          'px-3 py-2 font-mono text-xs leading-relaxed text-vybe-300/80 transition-opacity duration-300',
          'animate-in fade-in slide-in-from-bottom-1',
        )}
        key={index}
      >
        {snippet.code}
      </pre>
    </div>
  );
};
