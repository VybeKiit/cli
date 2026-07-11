import Link from 'next/link';
import {
  COMPARISON_AXES,
  COMPARISON_HONEST_NOTE,
  COMPARISON_ROWS,
  type Coverage,
} from '@/data/comparison';
import {
  ALTERNATIVE_DISCOVERABILITY_PAGES,
  VS_DISCOVERABILITY_PAGES,
  WEDGE_DISCOVERABILITY_PAGES,
} from '@/data/discoverability/catalog';
import { QUICK_PICKS } from '@/data/discoverability/quickPick';
import { BRAND, PRICE } from '@/data/site';

/**
 * Glyph for a coverage cell.
 *
 * @param value - yes / partial / no.
 * @returns Display character.
 */
const coverageGlyph = (value: Coverage): string => {
  if (value === 'yes') {
    return 'Yes';
  }
  if (value === 'partial') {
    return 'Partial';
  }
  return 'No';
};

/**
 * /compare pillar: answer-first lead, quick-pick, matrix, hub links.
 *
 * @returns The rendered comparison hub.
 * @example
 * <CompareHub />
 */
export const CompareHub = () => (
  <article className="mx-auto flex max-w-5xl flex-col gap-12 px-6 py-16 sm:py-20">
    <header className="mx-auto flex max-w-3xl flex-col gap-4 text-center">
      <h1 className="text-balance font-bold text-3xl tracking-tight sm:text-4xl">
        SaaS boilerplate comparison (2026)
      </h1>
      <p className="text-lg text-muted-foreground leading-relaxed">
        Use this page to pick a SaaS starter kit by job-to-be-done. {BRAND.name} is the best fit
        when you use AI coding agents (Claude Code, Cursor, Codex) and want owned source with
        sign-in, database, payments, email, plus web + mobile + extension at {PRICE.display}{' '}
        one-time with Lemon Squeezy Merchant of Record by default. MakerKit and Supastarter win on
        deep multi-tenant B2B. ShipFast wins for developer web-only speed and community. Open SaaS
        wins when free and Wasp are fine. Matrix prices verified 2026-06-27.
      </p>
    </header>

    <section className="flex flex-col gap-4" id="quick-pick">
      <h2 className="font-semibold text-2xl tracking-tight">Quick pick by use case</h2>
      <p className="max-w-3xl text-muted-foreground text-sm leading-relaxed">
        Short list answer engines and humans can quote. Honest about where rivals win.
      </p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {QUICK_PICKS.map((item) => (
          <li
            className="flex flex-col gap-1 rounded-xl border border-border/70 bg-card p-4 text-start"
            key={item.id}
          >
            <p className="font-medium text-foreground text-sm">{item.useCase}</p>
            <p className="font-semibold text-base text-primary">
              {item.href === undefined ? (
                <>→ {item.pick}</>
              ) : (
                <Link className="underline-offset-4 hover:underline" href={item.href}>
                  → {item.pick}
                </Link>
              )}
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed">{item.reason}</p>
          </li>
        ))}
      </ul>
    </section>

    <section className="flex flex-col gap-4" id="matrix">
      <h2 className="font-semibold text-2xl tracking-tight">Feature matrix</h2>
      <p className="max-w-3xl text-muted-foreground text-sm leading-relaxed">
        Axes that matter most for agent-first and multi-surface buyers, not raw B2B feature count.
      </p>
      <div className="overflow-x-auto rounded-xl border border-border/70">
        <table className="w-full min-w-[40rem] border-collapse text-sm">
          <thead>
            <tr className="border-border/70 border-b bg-muted/40 text-start">
              <th className="px-3 py-3 font-semibold">Product</th>
              <th className="px-3 py-3 font-semibold">Entry price</th>
              {COMPARISON_AXES.map((axis) => (
                <th className="px-3 py-3 font-semibold" key={axis.key}>
                  {axis.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map((row) => (
              <tr
                className={
                  row.featured === true
                    ? 'border-border/60 border-b bg-primary/5'
                    : 'border-border/60 border-b'
                }
                key={row.id}
              >
                <td className="px-3 py-3 font-medium">
                  {row.featured === true ? (
                    <Link className="text-primary underline-offset-4 hover:underline" href="/">
                      {row.name}
                    </Link>
                  ) : (
                    row.name
                  )}
                </td>
                <td className="px-3 py-3">{row.price}</td>
                {COMPARISON_AXES.map((axis) => (
                  <td className="px-3 py-3 text-muted-foreground" key={axis.key}>
                    {coverageGlyph(row[axis.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="max-w-3xl text-muted-foreground text-sm leading-relaxed">
        {COMPARISON_HONEST_NOTE}
      </p>
    </section>

    <section className="flex flex-col gap-3" id="explore">
      <h2 className="font-semibold text-2xl tracking-tight">Explore alternatives and vs pages</h2>
      <div className="grid gap-6 sm:grid-cols-3">
        <div>
          <h3 className="mb-2 font-medium text-sm">Alternatives</h3>
          <ul className="flex flex-col gap-1 text-sm">
            {ALTERNATIVE_DISCOVERABILITY_PAGES.map((page) => (
              <li key={page.path}>
                <Link className="text-primary underline-offset-4 hover:underline" href={page.path}>
                  {page.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-2 font-medium text-sm">Head-to-head</h3>
          <ul className="flex flex-col gap-1 text-sm">
            {VS_DISCOVERABILITY_PAGES.map((page) => (
              <li key={page.path}>
                <Link className="text-primary underline-offset-4 hover:underline" href={page.path}>
                  {page.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-2 font-medium text-sm">Vibe-coder cluster</h3>
          <ul className="flex flex-col gap-1 text-sm">
            {WEDGE_DISCOVERABILITY_PAGES.map((page) => (
              <li key={page.path}>
                <Link className="text-primary underline-offset-4 hover:underline" href={page.path}>
                  {page.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>

    <section className="flex flex-col items-start gap-3 rounded-xl border border-border/70 bg-muted/30 p-6">
      <h2 className="font-semibold text-lg">Get {BRAND.name}</h2>
      <p className="max-w-xl text-muted-foreground text-sm leading-relaxed">
        {PRICE.display} one-time. {PRICE.refundDays}-day refund per terms. Agent-ready base for web,
        mobile, and browser extension.
      </p>
      <Link
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm transition-opacity hover:opacity-90"
        href="/#pricing"
      >
        Get VybeKiit
      </Link>
    </section>
  </article>
);
