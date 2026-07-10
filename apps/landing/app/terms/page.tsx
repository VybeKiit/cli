import { CheckoutShell } from '@/components/CheckoutShell';
import { TERMS_SECTIONS } from '@/data/legal';

export const metadata = {
  title: 'Terms of Service — VybeKiit',
};

/**
 * Terms of Service for the store — renders the typed `TERMS_SECTIONS` data.
 * Uses the same marketing chrome as the visitor homepage.
 */
const TermsPage = () => (
  <CheckoutShell>
    <article className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-16 sm:py-20">
      <header className="flex flex-col gap-2 border-border/60 border-b pb-6">
        <h1 className="font-bold text-3xl tracking-tight sm:text-4xl">Terms of Service</h1>
        {/* TODO(vybekiit): set the effective date before launch. */}
        <p className="text-muted-foreground text-sm">Last updated: June 29, 2026</p>
      </header>
      {TERMS_SECTIONS.map((section) => (
        <section key={section.heading} className="flex flex-col gap-2">
          <h2 className="font-semibold text-xl tracking-tight">{section.heading}</h2>
          <p className="text-muted-foreground leading-relaxed">{section.body}</p>
        </section>
      ))}
    </article>
  </CheckoutShell>
);

export default TermsPage;
