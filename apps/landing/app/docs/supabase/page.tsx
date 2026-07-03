import { CheckoutShell } from '@/components/checkout-shell';

export const metadata = {
  title: 'Supabase Integration — VybeKiit',
  description:
    'How VybeKiit integrates Supabase for database, auth, and storage — and how the AI agent provisions it end-to-end.',
};

interface DocSection {
  readonly heading: string;
  readonly body: string;
}

const SECTIONS: readonly DocSection[] = [
  {
    heading: 'Overview',
    body: 'VybeKiit is a paid starter kit that lets non-technical builders ship real, money-making apps by describing what they want to an AI agent. Supabase is the default database, authentication, and storage layer across every VybeKiit template (web, mobile, and extension). A builder who does not customize their stack ships on Supabase out of the box.',
  },
  {
    heading: 'What Supabase powers',
    body: 'Database — Supabase Postgres via a provider-agnostic DataProvider interface. Authentication — better-auth bound to the Supabase Postgres database. Storage — the StorageProvider interface backed by Supabase Storage. The same goal-named skills ("save my data", "add sign-in", "add files") wire whichever provider is selected; Supabase is the default each resolves to.',
  },
  {
    heading: 'How the agent provisions Supabase',
    body: "The VybeKiit onboarding skill provisions Supabase end-to-end using the Supabase CLI: after an interactive browser login, the agent runs `supabase projects create`, generates the database password, picks a region from one plain-language question, polls until the project is healthy, writes SUPABASE_URL / ANON / SERVICE_ROLE into the project's .env, and pushes the schema. The builder never types an environment variable by hand.",
  },
  {
    heading: 'Environment & auth model',
    body: ".env is the single source of truth for runtime secrets (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY). CLI/deploy auth lives in Supabase's own credential store via `supabase login`, not in .env. The VybeKiit doctor command verifies the toolchain and connectivity by probing a live Supabase call rather than reading tokens from a file.",
  },
  {
    heading: 'Swapping providers',
    body: 'Supabase is the recommended default, not a lock-in. The DataProvider interface also has adapters for Neon, Firebase, Railway Postgres, MongoDB Atlas, and AWS — selected by a single .env setting the agent manages. Adding an adapter never adds a new skill; the goal-named skills are written once against the interface.',
  },
];

/**
 * Public Supabase integration doc — the URL the Supabase partner listing points at.
 * Describes the real integration (default DB/auth/storage + agent provisioning), so the
 * partner application's required "integration docs" link resolves to accurate content.
 */
export default function SupabaseDocPage() {
  return (
    <CheckoutShell>
      <article className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-16">
        <header className="flex flex-col gap-2">
          <p className="font-medium text-primary text-sm uppercase tracking-wide">Integration</p>
          <h1 className="font-bold text-3xl tracking-tight">VybeKiit + Supabase</h1>
          <p className="text-muted-foreground">
            How VybeKiit uses Supabase for database, auth, and storage — and how the AI agent sets
            it up end-to-end so a non-technical builder is live on Supabase in their first session.
          </p>
        </header>
        {SECTIONS.map((section) => (
          <section key={section.heading} className="flex flex-col gap-2">
            <h2 className="font-semibold text-xl">{section.heading}</h2>
            <p className="text-muted-foreground">{section.body}</p>
          </section>
        ))}
      </article>
    </CheckoutShell>
  );
}
