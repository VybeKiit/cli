import { MarketingShell } from '@/components/marketing-shell';

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

        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-xl">1. What we collect</h2>
          <p className="text-muted-foreground">
            We collect the information you give us (such as your email when you sign up) and basic
            usage data needed to run [Your Product].
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-xl">2. How we use it</h2>
          <p className="text-muted-foreground">
            We use your information to provide the service, process payments, and keep your account
            secure. We do not sell your personal data.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-xl">3. Sharing</h2>
          <p className="text-muted-foreground">
            We share data only with the providers that run the service (for example, hosting,
            database, and payments) and only as needed to operate [Your Product].
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-xl">4. Your choices</h2>
          <p className="text-muted-foreground">
            You can ask us to access or delete your information at any time by contacting us.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-xl">5. Contact</h2>
          <p className="text-muted-foreground">
            Questions about your privacy? Email [your-email@example.com].
          </p>
        </section>
      </article>
    </MarketingShell>
  );
}
