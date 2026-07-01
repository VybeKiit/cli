/** Cheeky plain-English vibe hints keyed by brand-mark slug — one string per slug. */
export const VIBE_HINTS: Readonly<Record<string, string>> = {
  // Builder tools (hero orbit)
  cursor:
    'Your AI coding buddy with the fancy autocomplete. You describe; it types — you never touch the plumbing.',
  claude:
    'The assistant that reads your whole project and actually gets context. You talk goals; it writes the code.',
  codex:
    "OpenAI's other brain — great at shipping features from a plain-English prompt. Your agent picks when to use it.",
  github:
    'Where your code lives online so you never lose a file. Your agent pushes; you never learn git commands.',
  figma:
    'The design mockup tool designers love. You can ignore it — your agent builds screens from words, not pixel-pushing.',
  typescript:
    'Code with guardrails so things break loudly instead of silently. Your agent writes it; you never fix typo hunts.',
  nodedotjs:
    "It's a server. Doesn't tell you much, huh? Good news: your agent lives here so you don't have to.",
  playwright:
    'A robot that clicks through your app like a user would. Your agent uses it to catch broken checkout before you do.',

  // Product stack (pricing row)
  nextdotjs:
    'The engine behind your website — pages, sign-in, checkout, all of it. Fast by default; your agent wires it up.',
  tailwindcss:
    'Makes your site look beautiful without you picking colors. Your agent handles the styling — you just say "make it pop."',
  react:
    'How buttons, forms, and dashboards actually show up on screen. Lego blocks your agent snaps together.',
  shadcn:
    'Pre-built screen pieces that actually look good. Your agent picks them — you just say "make a dashboard."',
  supabase:
    "Where your app's info lives online — users, orders, settings, the lot. Your agent sets it up; you never open an admin panel unless you want to.",
  cloudflare:
    'Where your site lives on the internet — fast, cheap, worldwide. Your agent puts it live; you never touch a server dashboard.',
  lemonsqueezy:
    'The cash register that also handles tax headaches. You paste one key; buyers pay; you get paid.',
  betterauth:
    'Sign-in without the "why won\'t Google login work" spiral. Your agent wires it; users get a magic link or password.',
  openai:
    'The brains behind smart features in your app — chat, summaries, whatever you describe. One secret key in, magic out.',
  expo: 'Turns your idea into a real iPhone and Android app. Your agent handles the builds; you never install Apple dev tools.',
  wxt: 'The starter kit for browser add-ons — the little popup, the behind-the-scenes bits, the Chrome store listing. Agent territory only.',
  sonner:
    'Those little pop-up messages that say "Saved!" or "Oops." Polished feedback your agent drops in for free.',
  resend:
    'Sends emails from your app — welcome messages, receipts, password resets. Your agent connects it; you never touch mail settings.',
  stripe:
    'Another way to take card payments and monthly plans. Only if you need it — your agent flips the switch, not you.',
  paypal:
    'PayPal checkout for buyers who insist on it. Your agent turns it on — you never read their setup docs.',
  vercel:
    "Alternative place to host your site if Cloudflare isn't your vibe. One secret setting; your agent handles the rest.",
  amazonaws:
    'The big-cloud backup plan — online filing cabinets for your data and files. Your agent navigates the maze; you stay out.',
  mongodb:
    'Stores your app info in flexible chunks instead of neat rows. Only if you need it — your agent picks it, not you.',
  google:
    'Sign in with Google — one click for your users. Your agent drops in the keys; you approve the popup once.',
  sentry:
    'Catches crashes before your users DM you "it\'s broken." Your agent wires it; you get a plain summary, not gibberish error codes.',
  plausible:
    'Simple visitor counts — how many people showed up, no creepy cookie banner required. Your agent adds it; you check an easy stats page.',
  googlechrome:
    'The browser your extension lives in. Users install from the Chrome Web Store — your agent handles submission.',
  appstore:
    'Where iPhone users download your app. Apple review is painful; your agent walks you through one step at a time.',
  googleplay:
    "Android's app store — same deal, different logo. Your agent handles the listing; you click approve.",
};
