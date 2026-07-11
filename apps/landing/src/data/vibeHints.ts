/**
 * English SSOT for brand-mark vibe hints (plain language, no coding jargon).
 * Localized catalogs live under `src/i18n/vibeHints/`.
 */
export const VIBE_HINTS: Readonly<Record<string, string>> = {
  // AI coding agents (trust strip top marquee)
  cursor:
    'Your AI coding buddy. You describe the app in plain words; it types and never asks you to touch the plumbing.',
  claude:
    'The agent that reads your whole project and actually gets the goal. You talk; it builds.',
  codex:
    'OpenAI coding agent in the terminal. Same VybeKiit skills; pick the agent you already use.',
  kiro: "Amazon's AI coding agent. Same package and skills; stay in the agent you like.",
  kimi: "Moonshot's coding agent. Describe the product; it works the package for you.",
  zed: 'Fast editor with its own AI. Still runs the full VybeKiit path: idea → live app.',
  opencode: 'Open-source coding agent. Same plain-language skills; no lock-in to one vendor.',
  grok: 'xAI coding agent. Talk in plain language; it builds on a ready base instead of inventing infrastructure from zero.',
  googlegemini: "Google's coding agent. Same skills; you never juggle a different playbook.",
  devin: 'Autonomous software agent. VybeKiit gives it payments, memory, and the ship checklist.',

  // Builder tools / product stack
  github:
    'Where your project lives online so you never lose a file. Your agent uploads; you never learn git.',
  figma:
    'Design mockups if you want them. Most vibe coders skip it; the agent builds screens from words.',
  typescript: 'Guardrails so things break out loud instead of silently. Your agent writes it.',
  nodedotjs:
    "It's a server. Doesn't tell you much, huh? Good news: your agent lives here so you don't have to.",
  playwright:
    'A robot that clicks through your app like a user. Catches broken checkout before buyers do.',

  nextdotjs:
    'The engine behind your website: pages, sign-in, checkout. Fast by default; your agent wires it.',
  tailwindcss:
    'Makes your site look good without you picking hex colors. Say "make it pop" and move on.',
  react:
    'How buttons, forms, and dashboards show up on screen. Lego blocks your agent snaps together.',
  shadcn:
    'Pre-built screen pieces that look polished. You say "make a dashboard"; the agent picks them.',
  supabase:
    'Where your app remembers things: users, orders, settings. Agent sets it up; you stay out of admin panels.',
  cloudflare: 'Where your site lives on the internet: fast, cheap, worldwide. Agent puts it live.',
  lemonsqueezy:
    'The cash register that also handles tax headaches. Paste one key; buyers pay; you get paid.',
  betterauth:
    'Sign-in without the "why won\'t Google login work" spiral. Magic link or password, agent-wired.',
  openai: 'Brains for smart features in your app: chat, summaries, whatever you describe.',
  expo: 'Turns your idea into a real iPhone and Android app for the App Store and Play Store.',
  wxt: 'Browser add-ons: popup, background bits, Chrome store listing. Agent territory only.',
  sonner:
    'Little pop-ups that say "Saved!" or "Oops." Polished feedback the agent drops in for free.',
  resend: 'Emails from your app: welcome notes, receipts, password resets. Agent connects it.',
  stripe:
    'We give you a payment system: cards and subscriptions when you need them. Agent flips the switch.',
  paypal:
    'PayPal checkout for buyers who insist on it. Agent turns it on; you never read setup docs.',
  vercel:
    "Another place to host your site if Cloudflare isn't your vibe. One secret; agent handles it.",
  amazonaws: 'Big-cloud backup plan for data and files. Agent navigates the maze; you stay out.',
  mongodb: 'Stores app info in flexible chunks instead of neat rows. Only if you need it.',
  google: 'Sign up / sign in with Google. One click for users; agent drops in the keys once.',
  sentry:
    'Catches crashes before users DM "it\'s broken." You get a plain summary, not error gibberish.',
  plausible: 'Simple visitor counts: how many people showed up, no creepy cookie banner.',
  googlechrome: 'The browser your extension lives in. Users install from the Chrome Web Store.',
  appstore:
    'Where iPhone users download your app. Apple review is painful; agent walks you through it.',
  googleplay:
    "Android's app store. Same deal, different logo. Agent handles the listing; you approve.",
};
