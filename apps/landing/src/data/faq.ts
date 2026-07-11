/**
 * FAQ entries for JSON-LD and EN fallbacks.
 * GEO: natural-language questions as people ask answer engines (seo-geo-plan).
 * Keep ids/order aligned with `i18n/messages/*.ts` faq items.
 * Buyer voice: honest infra positioning; no “money in session one.”
 */
import { BRAND, PRICE } from '@/data/site';

/** One FAQ entry: a verbatim question heading and its answer-first body. */
export interface FaqItem {
  /** Stable render key. */
  readonly id: string;
  /** The question, used verbatim as the H3 (matches how vibe coders actually ask). */
  readonly question: string;
  /** Answer-first response — the direct answer leads, elaboration follows. */
  readonly answer: string;
}

/**
 * Shipped FAQ set: GEO intent questions first, then product risk.
 * Answers lead with the direct claim for AI extraction.
 */
export const FAQ: readonly FaqItem[] = [
  {
    id: 'best-non-technical',
    question: 'What is the best SaaS boilerplate for a non-technical founder?',
    answer: `The best fit is a kit an AI coding agent can operate without forcing you to resolve git merges or invent auth and payments. ${BRAND.name} is built for that: owned source, agent instructions, ${PRICE.display} one-time, Lemon Squeezy Merchant of Record by default, and web + mobile + extension bases. Developer-first kits such as ShipFast, MakerKit, or Supastarter are better if you or a hire will read and own the code daily.`,
  },
  {
    id: 'boilerplate-vs-lovable',
    question:
      'What is the difference between a SaaS boilerplate and a no-code AI app builder like Lovable?',
    answer: `A SaaS boilerplate gives you owned source code and product foundations (sign-in, database, payments) that you host and maintain. A no-code AI builder generates inside a managed platform. ${BRAND.name} is a boilerplate plus agent instructions for Claude Code, Cursor, or Codex. Lovable-style tools optimize speed of generation; ${BRAND.name} optimizes a maintainable product base you own.`,
  },
  {
    id: 'taxes-vat',
    question: 'Which SaaS boilerplate handles taxes and VAT for me?',
    answer: `${BRAND.name} defaults to Lemon Squeezy as Merchant of Record, so tax and VAT on software sales can be handled by the MoR instead of you filing every jurisdiction yourself. Shipped.club also defaults to Lemon Squeezy. Many other kits offer MoR providers optionally but leave Stripe (no MoR) as the common path. Hosting, database, email, and AI providers may still bill you separately.`,
  },
  {
    id: 'claude-cursor',
    question: 'What SaaS boilerplate works best with Claude Code and Cursor?',
    answer: `${BRAND.name} ships project structure and agent instructions those tools can read from the repo. It is not locked to one model or editor. Other kits may ship AGENTS.md for developers; ${BRAND.name} aims the agent layer at someone who should not have to decode every error or merge conflict.`,
  },
  {
    id: 'three-platforms',
    question: 'Which SaaS boilerplate includes web, mobile, and a browser extension?',
    answer: `${BRAND.name} includes web (Next.js), mobile (Expo), and browser-extension (WXT) bases in one purchase. Most rivals are web-only; some sell mobile or extension as separate products. You can still use only the web part first.`,
  },
  {
    id: 'cheapest',
    question: 'What is the cheapest full-stack SaaS boilerplate with agent support?',
    answer: `Open SaaS is free if you accept the Wasp stack and operate it yourself. Among paid agent-oriented kits, ${BRAND.name} is ${PRICE.display} one-time at launch for three surfaces and agent instructions. Outside services (hosting, database, email, AI, payment processing) may charge based on usage.`,
  },
  {
    id: 'shipfast-2026',
    question: 'Is ShipFast worth it in 2026, or is there a better alternative for vibe coders?',
    answer: `ShipFast is still worth it for developers who want a proven web-only boilerplate and a large community. For vibe coders who want an agent to operate the build, three platforms, and MoR default, ${BRAND.name} is the stronger alternative. See the ShipFast alternative and comparison pages for the full trade-off.`,
  },
  {
    id: 'boilerplate-vs-scratch',
    question: 'Should I use a SaaS boilerplate or build from scratch with AI?',
    answer:
      'Use a boilerplate when you need auth, payments, and data wired without reinventing them every chat session. Build from scratch only if you want full architectural freedom and accept the cost of re-solving infrastructure. Agents amplify the base you give them; a ready base reduces silent gaps (no checkout, no real auth).',
  },
  {
    id: 'refund',
    question: 'What if VybeKiit is not for me?',
    answer: `You can request a refund within ${PRICE.refundDays} days of purchase, per the refund terms. Access to the private project material is revoked when a refund is issued.`,
  },
  {
    id: 'safe-production',
    question: 'Is this safe for production?',
    answer:
      'The kit follows common engineering practices and gives a more orderly base than unplanned generated code. Final safety still depends on your changes, the providers you connect, the permissions you set, and the checks you run. For medical, financial, or highly sensitive systems, get a professional security review.',
  },
];
