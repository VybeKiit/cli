import { MarketingShell } from '@/components/marketing-shell';
import { PRIVACY_SECTIONS } from '@/data/legal';

/**
 * Privacy Policy — a plain-language skeleton, ready to display. The specifics are
 * marked for the agent to fill from the builder's details; a human should review
 * before launch (this template is not legal advice).
 */
export default function PrivacyPage() {
  return (
    <MarketingShell>
      <article className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-16">
        <header className="flex flex-col gap-1">
          <h1 className="font-bold text-3xl tracking-tight">Privacy Policy</h1>
          {/* TODO(vybekiit): set the effective date — skill: onboarding */}
          <p className="text-muted-foreground text-sm">Last updated: [add date]</p>
        </header>

        {/* TODO(vybekiit): fill in company name, contact email, and the data you actually
            collect (analytics, payments, etc.), then have a human review — skill: onboarding */}

        {PRIVACY_SECTIONS.map((section) => (
          <section key={section.heading} className="flex flex-col gap-2">
            <h2 className="font-semibold text-xl">{section.heading}</h2>
            <p className="text-muted-foreground">{section.body}</p>
          </section>
        ))}
      </article>
    </MarketingShell>
  );
}
