/**
 * FAQ entries for vibe coders deciding which package to buy.
 * Answer-first so AI answer engines can quote the lead sentence.
 * Buyer voice: plain language, no em dashes, decide + guide.
 */

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
 * Shipped FAQ set: package choice first, then risk, tools, and rivals.
 * Aim: help a non-coder pick VybeKiit with confidence.
 */
export const FAQ: readonly FaqItem[] = [
  {
    id: 'which-package',
    question: 'Which package should I get?',
    answer:
      'There is only one package. You get the full kit: AI operator + web + mobile + browser extension in a single one-time purchase. No tiers, no “pro” upsell, no picking web-only vs mobile-only. If you only ship a website first, the mobile and extension pieces stay ready for when you need them.',
  },
  {
    id: 'vibe-coder',
    question: 'I only talk to AI tools. Is this for me?',
    answer:
      'Yes. VybeKiit is built for vibe coders: you describe what you want in plain language, and the agent plans, builds, wires payments, verifies, and puts it live. You do not need to read code, fix merges, or learn DevOps. If you already use Claude Code, Cursor, Codex, Kiro, or a similar tool, you are the target buyer.',
  },
  {
    id: 'best-for-non-technical',
    question: 'What is the best SaaS kit if I am not a developer?',
    answer:
      'VybeKiit is the best fit when you want the agent to operate the whole product for you. Other kits hand you code and assume a developer stays in the loop. If you can already ship from a blank repo yourself, a free open-source starter may be enough. If you want “describe it → first payment,” pick VybeKiit.',
  },
  {
    id: 'only-need-web',
    question: 'I only need a website. Should I still buy the full kit?',
    answer:
      'Yes. The price is for the whole kit, and web is the path you start on. Mobile and the browser extension ship in the same purchase so you never pay again when your idea grows. There is no cheaper web-only SKU because the value is one agent that runs the full product, not a pile of half-kits.',
  },
  {
    id: 'vs-shipfast-lovable',
    question: 'How does this compare to ShipFast, Lovable, or MakerKit?',
    answer:
      'ShipFast and MakerKit are great if you are a developer who wants boilerplate and will wire the rest yourself. Lovable and similar AI builders are great for quick UI demos, not for owning a real stack with payments, updates, and three platforms. VybeKiit is the pick when you want one purchase, plain language, and an agent that actually ships and maintains the product.',
  },
  {
    id: 'price-worth-it',
    question: 'Why is it $29 when other kits cost $199+?',
    answer:
      'Because the product is one kit for vibe coders, not a stack of developer tools sold separately. Buying web + mobile + extension from rival kits can run past $600. VybeKiit bundles all three plus the agent operator for a launch price of $29 one-time, with a 14-day refund if it is not for you.',
  },
  {
    id: 'claude-cursor-kiro',
    question: 'Does it work with Claude Code, Cursor, Codex, and Kiro?',
    answer:
      'Yes. VybeKiit is designed so your AI coding tool is the operator: it decides the next step, runs it, and checks the result before moving on. Bring the agent you already pay for. You are not locked into one vendor’s chat UI.',
  },
  {
    id: 'refund-risk',
    question: 'What if it does not work for me?',
    answer:
      'You get a 14-day money-back window. Request a refund and GitHub access to the private repos is revoked. The goal is zero regret: try the flow, see if the agent can take you to a live checkout, and only keep it if it fits how you build.',
  },
  {
    id: 'taxes-payments',
    question: 'Do I have to handle sales tax and VAT myself?',
    answer:
      'No, if you use the default Lemon Squeezy path. Lemon Squeezy is a Merchant of Record, so it files global VAT and sales tax for you. You can still swap payment providers later; the kit is built so the agent wires checkout either way.',
  },
];
