import { MarketingShell } from '@/components/marketing-shell';

/**
 * Terms of Service — a plain-language skeleton, ready to display. The specifics
 * are marked for the agent to fill from the builder's details; a human should
 * review before launch (this template is not legal advice).
 */
export default function TermsPage() {
  return (
    <MarketingShell>
      <article className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-16">
        <header className="flex flex-col gap-1">
          <h1 className="font-bold text-3xl tracking-tight">Terms of Service</h1>
          {/* TODO(vybekiit): set the effective date — skill: onboarding */}
          <p className="text-muted-foreground text-sm">Last updated: [add date]</p>
        </header>

        {/* TODO(vybekiit): fill in product name, company, contact email, and governing law,
            then have a human review before launch — skill: onboarding */}

        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-xl">1. Agreement to terms</h2>
          <p className="text-muted-foreground">
            By using [Your Product], you agree to these terms. If you do not agree, please do not
            use the service.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-xl">2. Using the service</h2>
          <p className="text-muted-foreground">
            You may use [Your Product] only as permitted by law and these terms. You are responsible
            for the activity in your account and for keeping your sign-in details secure.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-xl">3. Payments</h2>
          <p className="text-muted-foreground">
            Paid plans are billed in advance and are non-refundable except where required by law or
            stated otherwise. Prices may change with notice.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-xl">4. Liability</h2>
          <p className="text-muted-foreground">
            The service is provided "as is" without warranties. To the extent permitted by law,
            [Your Company] is not liable for indirect or incidental damages arising from your use.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-xl">5. Contact</h2>
          <p className="text-muted-foreground">
            Questions about these terms? Email [your-email@example.com].
          </p>
        </section>
      </article>
    </MarketingShell>
  );
}
