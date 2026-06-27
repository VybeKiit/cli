import { MarketingShell } from '@/components/marketing-shell';
import { TERMS_SECTIONS } from '@/data/legal';

export const metadata = {
  title: 'Terms of Service — VybeKiit',
};

/**
 * Terms of Service for the store — renders the typed `TERMS_SECTIONS` data. A
 * plain-language skeleton; a human should review before any real launch (this is
 * not legal advice).
 */
export default function TermsPage() {
  return (
    <MarketingShell>
      <article className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-16">
        <header className="flex flex-col gap-1">
          <h1 className="font-bold text-3xl tracking-tight">Terms of Service</h1>
          {/* TODO(vybekiit): set the effective date before launch. */}
          <p className="text-muted-foreground text-sm">Last updated: [add date]</p>
        </header>
        {TERMS_SECTIONS.map((section) => (
          <section key={section.heading} className="flex flex-col gap-2">
            <h2 className="font-semibold text-xl">{section.heading}</h2>
            <p className="text-muted-foreground">{section.body}</p>
          </section>
        ))}
      </article>
    </MarketingShell>
  );
}
