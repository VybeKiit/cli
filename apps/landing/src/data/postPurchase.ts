/**
 * Post-purchase session-1 copy — success page + anything that points a new vibe coder
 * from "I paid" to "my app is open on my computer." Keep plain language only.
 */

/** Canonical first commands after a successful purchase (CLI SSOT). */
export const POST_PURCHASE_COMMANDS = {
  setup: 'npx vybekiit setup',
  createWeb: 'npx vybekiit create app --web',
  createMobile: 'npx vybekiit create app --mobile',
  createExtension: 'npx vybekiit create app --extension',
} as const;

/**
 * Ready prompt the vibe coder pastes into any AI coding tool after create app.
 * Matches the buyer template READMEs (web/mobile/extension).
 */
export const POST_PURCHASE_AGENT_PROMPT = `Set up my app.

I am a non-technical vibe coder. Read AGENTS.md and language.md.
Speak plain language. One action at a time. Translate any errors.
Celebrate progress. Do not dump technical steps on me.

Start with first-time setup until I can see my app running on my computer.`;

/**
 * Full agent drop when the vibe coder has only accepted the GitHub invite (no app folder yet).
 */
export const POST_PURCHASE_AGENT_FROM_INVITE = `I just bought VybeKiit. I accepted the GitHub invite. I am non-technical.

Do everything for me:
1. Check Node is installed (need 20 or newer).
2. Run: npx vybekiit setup
3. If GitHub login is needed, tell me the ONE click to do, then continue.
4. Run: npx vybekiit create app --web
5. Open the new project and run first-time setup until I can open the app in my browser.
6. Talk to me in plain language. One step at a time. No jargon.

If create app fails because it cannot download the kit, stop and tell me
exactly what access is missing in plain words (do not paste raw errors).`;

/** Numbered human steps shown on the success page. */
export const POST_PURCHASE_STEPS: readonly {
  readonly title: string;
  readonly body: string;
  readonly code?: string;
}[] = [
  {
    title: 'Accept the GitHub invite',
    body: 'Open the email from GitHub and click Accept invitation. Use the same GitHub account you typed at checkout. This only unlocks access — it is not your app yet.',
  },
  {
    title: 'Install Node if you do not have it',
    body: 'You need Node 20 or newer so the starter command can run. If you are not sure, open nodejs.org, install the LTS version (big green button), then restart Terminal.',
  },
  {
    title: 'Set up tools on your computer',
    body: 'Open Terminal (Mac: Spotlight, type Terminal). Paste the first line, press Enter, and follow one browser login if it asks. When tools look ready, paste the second line.',
    code: `${POST_PURCHASE_COMMANDS.setup}\n${POST_PURCHASE_COMMANDS.createWeb}`,
  },
  {
    title: 'Open the new folder in your AI coding tool',
    body: 'Use Claude Code, Cursor, Codex, or any AI coding helper. Open the folder the command created (not the private GitHub page, and never a Download ZIP).',
  },
  {
    title: 'Paste the ready prompt',
    body: 'Say this to your helper. It reads the kit instructions and walks you one step at a time until you can see your app.',
    code: POST_PURCHASE_AGENT_PROMPT,
  },
];

/** Short "do not" list for the green Code / ZIP wall. */
export const POST_PURCHASE_DO_NOT: readonly string[] = [
  'Do not use Download ZIP from GitHub.',
  'You do not need to pick HTTPS vs SSH — the setup command handles access.',
  'Do not dig through the private GitHub folders looking for "the app." The create command builds your app folder on your computer.',
];
