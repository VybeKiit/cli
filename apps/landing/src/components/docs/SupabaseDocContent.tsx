'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { LogoMarkIcon } from '@/components/landing/LogoMarkIcon';
import { VybeLogoIcon } from '@/components/ui/CustomIcons';
import { LANDING_EASE } from '@/data/landing';

/** Supabase brand green — the accent this partner doc leans on. */
const SUPABASE_GREEN = '#3FCF8E';

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

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
} as const;

/** The VybeKiit × Supabase partner lockup shown in the doc header. */
export function SupabaseDocBrand() {
  return (
    <Link className="flex items-center gap-2.5" href="/">
      <VybeLogoIcon className="h-6 w-6" />
      <span className="font-semibold tracking-tight">VybeKiit</span>
      <span className="text-muted-foreground text-sm">×</span>
      <LogoMarkIcon className="h-6 w-6" mono={true} slug="supabase" />
      <span className="font-semibold tracking-tight">Supabase</span>
    </Link>
  );
}

/** Animated partner-doc body — official-docs vibe: green accent, staggered reveals, quiet motion. */
export function SupabaseDocContent() {
  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-14 px-6 py-16 md:py-24">
      <motion.header
        className="flex flex-col gap-5"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: LANDING_EASE }}
      >
        <div className="flex items-center gap-4">
          <VybeLogoIcon className="h-10 w-10" />
          <span className="text-2xl text-muted-foreground">×</span>
          <LogoMarkIcon className="h-10 w-10" slug="supabase" />
        </div>
        <p
          className="font-medium text-sm uppercase tracking-[0.14em]"
          style={{ color: SUPABASE_GREEN }}
        >
          Integration
        </p>
        <h1 className="font-bold text-4xl tracking-tight md:text-5xl">VybeKiit + Supabase</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          How VybeKiit uses Supabase for database, auth, and storage — and how the AI agent sets it
          up end-to-end so a non-technical builder is live on Supabase in their first session.
        </p>
      </motion.header>

      <div className="flex flex-col gap-12">
        {SECTIONS.map((section, index) => (
          <motion.section
            className="flex flex-col gap-3"
            key={section.heading}
            transition={{ duration: 0.6, delay: index * 0.05, ease: LANDING_EASE }}
            {...fadeUp}
          >
            <h2 className="flex items-center gap-3 font-semibold text-2xl tracking-tight">
              <span
                aria-hidden="true"
                className="h-5 w-1 rounded-full"
                style={{ backgroundColor: SUPABASE_GREEN }}
              />
              {section.heading}
            </h2>
            <p className="text-muted-foreground leading-relaxed">{section.body}</p>
          </motion.section>
        ))}
      </div>

      <motion.a
        className="inline-flex w-fit items-center gap-2 rounded-full border px-5 py-2.5 font-medium text-sm transition-colors hover:bg-foreground/5"
        href="https://supabase.com"
        rel="noreferrer"
        target="_blank"
        transition={{ duration: 0.6, ease: LANDING_EASE }}
        {...fadeUp}
      >
        <LogoMarkIcon className="h-5 w-5" mono={true} slug="supabase" />
        Learn more about Supabase
        <span aria-hidden="true">→</span>
      </motion.a>
    </article>
  );
}
