import Link from 'next/link';
import { INSPIRATION_DIRECTIONS } from '@/data/inspirations';

export const metadata = {
  title: 'VybeKiit — Landing inspirations',
  description:
    'Ten distinct landing-page layout directions for VybeKiit — anti-generic SaaS, agent-as-operator focused.',
};

/**
 * Gallery of landing-page vibe directions from `docs/positioning/landing-direction.md`.
 * Each card links to a full-page preview at `/inspirations/[slug]`.
 */
export default function InspirationsIndexPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-neutral-800 border-b px-6 py-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <Link href="/" className="text-neutral-500 text-sm hover:text-neutral-300">
              ← Production home
            </Link>
            <h1 className="mt-2 font-bold text-3xl tracking-tight">Landing inspirations</h1>
            <p className="mt-2 max-w-xl text-neutral-400 text-sm">
              Ten layout directions — not generic SaaS. Each shows the agent operating, not code
              walls. Sourced from positioning docs; pick winners for A/B tests.
            </p>
          </div>
        </div>
      </header>
      <main className="mx-auto grid max-w-5xl gap-4 px-6 py-10 sm:grid-cols-2">
        {INSPIRATION_DIRECTIONS.map((direction) => (
          <Link
            key={direction.slug}
            href={`/inspirations/${direction.slug}`}
            className="group relative overflow-hidden rounded-xl border border-neutral-800 p-6 transition-colors hover:border-neutral-600"
            style={{
              background: `linear-gradient(135deg, ${direction.palette.bg}22, transparent)`,
            }}
          >
            {direction.recommended ? (
              <span className="absolute end-4 top-4 rounded-full bg-amber-500/20 px-2 py-0.5 font-medium text-amber-400 text-xs">
                A/B pick
              </span>
            ) : null}
            <div className="mb-4 flex gap-2">
              {Object.values(direction.palette)
                .slice(0, 3)
                .map((color) => (
                  <span
                    key={color}
                    className="size-6 rounded-full border border-white/10"
                    style={{ background: color }}
                  />
                ))}
            </div>
            <h2 className="font-semibold text-lg group-hover:text-white">{direction.name}</h2>
            <p className="mt-1 text-neutral-400 text-sm">{direction.vibe}</p>
            <p className="mt-4 text-balance font-medium text-neutral-200 text-sm">
              &ldquo;{direction.headline}&rdquo;
            </p>
          </Link>
        ))}
      </main>
    </div>
  );
}
