/**
 * Marketing copy for the home screen, as data the screen renders via `.map`.
 *
 * Mirrors the web template's `FEATURES` array (which the web keeps inline in
 * `page.tsx`); here it lives in `data/` per the kit's "separate data from UI" rule
 * so the agent edits one array instead of screen JSX.
 */

/** One feature highlight shown below the hero. */
export interface Feature {
  /** Short heading, e.g. "Payments built in". */
  readonly title: string;
  /** One-line supporting copy. */
  readonly body: string;
}

/** The three feature highlights on the home screen — placeholder copy the agent reshapes. */
export const FEATURES: readonly Feature[] = [
  { title: 'Payments built in', body: 'Take money on day one — Lemon Squeezy, Stripe, or PayPal.' },
  {
    title: 'Your data, ready',
    body: 'A database and sign-in wired up without the setup headache.',
  },
  { title: 'Live in minutes', body: 'Ship to the App Store and Play Store when you are ready.' },
];
