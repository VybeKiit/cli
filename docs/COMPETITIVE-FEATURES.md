# VybeKiit Feature Parity Checklist — vs. Industry SaaS Boilerplates

> Competitive analysis: what ShipFast ($199-$249), Makerkit ($299-$599), and Supastarter ($199-$399) ship vs. what VybeKiit currently supports.

## Legend
- ✅ Shipped and working
- 🔨 In progress / partially done
- ❌ Not yet implemented
- 🎯 VybeKiit unique advantage (competitors don't have this)
- N/A Not applicable to this template type

---

## 1. AUTHENTICATION

| Feature | ShipFast | Makerkit | Supastarter | VybeKiit Web | VybeKiit Mobile |
|---------|----------|----------|-------------|--------------|-----------------|
| Email/Password | ✅ | ✅ | ✅ | | |
| Magic Link (passwordless) | ✅ | ✅ | ✅ | | |
| Google OAuth | ✅ | ✅ | ✅ | | |
| GitHub OAuth | ❌ | ✅ | ✅ | | |
| Apple Sign-In | ❌ | ❌ | ❌ | | |
| Multi-Factor Auth (MFA/2FA) | ❌ | ✅ | ❌ | | |
| Email verification flow | ✅ | ✅ | ✅ | | |
| Password reset flow | ✅ | ✅ | ✅ | | |
| Session management | ✅ | ✅ | ✅ | | |
| Protected API routes | ✅ | ✅ | ✅ | | |

---

## 2. BILLING & PAYMENTS

| Feature | ShipFast | Makerkit | Supastarter | VybeKiit Web | VybeKiit Mobile |
|---------|----------|----------|-------------|--------------|-----------------|
| Stripe integration | ✅ | ✅ | ✅ | | |
| Lemon Squeezy | ✅ | ✅ | ✅ | | |
| Paddle | ❌ | ✅ | ❌ | | |
| Subscription plans (recurring) | ✅ | ✅ | ✅ | | |
| One-time payments | ✅ | ✅ | ✅ | | |
| Per-seat billing | ❌ | ✅ | ✅ | | |
| Metered/usage billing | ❌ | ✅ | ❌ | | |
| Stripe webhooks handling | ✅ | ✅ | ✅ | | |
| Customer portal (self-service) | ✅ | ✅ | ✅ | | |
| Pricing page component | ✅ | ✅ | ✅ | | |
| Free trial support | ❌ | ✅ | ✅ | | |
| Billing provider abstraction | ❌ | ✅ | ❌ | | |
| RevenueCat (mobile IAP) | ❌ | ❌ | ❌ | | N/A |

---

## 3. MULTI-TENANCY & TEAMS

| Feature | ShipFast | Makerkit | Supastarter | VybeKiit Web | VybeKiit Mobile |
|---------|----------|----------|-------------|--------------|-----------------|
| Organizations/Workspaces | ❌ | ✅ | ✅ | | |
| Team invitations | ❌ | ✅ | ✅ | | |
| Role-based access (RBAC) | ❌ | ✅ | ✅ | | |
| Account modes (personal/org/hybrid) | ❌ | ✅ | ❌ | | |
| Member management | ❌ | ✅ | ✅ | | |
| Switch between organizations | ❌ | ✅ | ✅ | | |

---

## 4. EMAIL

| Feature | ShipFast | Makerkit | Supastarter | VybeKiit Web | VybeKiit Mobile |
|---------|----------|----------|-------------|--------------|-----------------|
| Transactional emails | ✅ | ✅ | ✅ | | |
| Email templates (React Email) | ❌ | ✅ | ✅ | | |
| DNS setup (SPF/DKIM/DMARC) docs | ✅ | ✅ | ❌ | | |
| Resend integration | ✅ | ✅ | ✅ | | |
| Mailgun integration | ✅ | ❌ | ❌ | | |
| Email webhook (receive & forward) | ✅ | ❌ | ❌ | | |
| Welcome/onboarding email sequence | ❌ | ❌ | ❌ | | |

---

## 5. DATABASE & ORM

| Feature | ShipFast | Makerkit | Supastarter | VybeKiit Web | VybeKiit Mobile |
|---------|----------|----------|-------------|--------------|-----------------|
| PostgreSQL (Supabase/Neon) | ✅ | ✅ | ✅ | | |
| MongoDB | ✅ | ❌ | ❌ | | |
| Drizzle ORM | ❌ | ✅ | ❌ | | |
| Prisma | ❌ | ✅ | ✅ | | |
| Database migrations | ❌ | ✅ | ✅ | | |
| Type-safe queries | ❌ | ✅ | ✅ | | |
| Row-Level Security (RLS) | ❌ | ✅ (Supabase) | ✅ | | |
| Seed scripts | ❌ | ✅ | ❌ | | |

---

## 6. UI & DESIGN SYSTEM

| Feature | ShipFast | Makerkit | Supastarter | VybeKiit Web | VybeKiit Mobile |
|---------|----------|----------|-------------|--------------|-----------------|
| Tailwind CSS | ✅ | ✅ (v4) | ✅ | | |
| shadcn/ui components | ❌ | ✅ | ✅ | | |
| Dark/Light theme toggle | ❌ | ✅ | ✅ | | |
| Mobile-responsive | ✅ | ✅ | ✅ | | |
| Animations (framer-motion) | ✅ | ❌ | ❌ | | |
| Figma UI Kit | ❌ | ✅ | ❌ | | |
| RTL support | ❌ | ❌ | ❌ | | |
| NativeWind (mobile) | N/A | N/A | N/A | N/A | |

---

## 7. MARKETING & SEO

| Feature | ShipFast | Makerkit | Supastarter | VybeKiit Web | VybeKiit Mobile |
|---------|----------|----------|-------------|--------------|-----------------|
| Landing page template | ✅ | ✅ | ✅ | | N/A |
| SEO meta tags | ✅ | ✅ | ✅ | | N/A |
| Sitemap generation | ✅ | ✅ | ✅ | | N/A |
| OpenGraph images | ✅ | ✅ | ❌ | | N/A |
| Blog (MDX/Markdoc) | ✅ | ✅ | ✅ | | N/A |
| Changelog page | ❌ | ✅ | ❌ | | N/A |
| Documentation/Help center | ❌ | ✅ | ❌ | | N/A |
| Structured data (JSON-LD) | ✅ | ✅ | ❌ | | N/A |
| Analytics (PostHog/Plausible) | ❌ | ✅ | ✅ | | |

---

## 8. ADMIN & INTERNAL TOOLS

| Feature | ShipFast | Makerkit | Supastarter | VybeKiit Web | VybeKiit Mobile |
|---------|----------|----------|-------------|--------------|-----------------|
| Super Admin dashboard | ❌ | ✅ | ✅ | | N/A |
| User management (ban/delete) | ❌ | ✅ | ✅ | | N/A |
| User impersonation | ❌ | ✅ | ❌ | | N/A |
| Organization management | ❌ | ✅ | ✅ | | N/A |
| Revenue/subscription overview | ❌ | ✅ | ❌ | | N/A |

---

## 9. INTERNATIONALIZATION (i18n)

| Feature | ShipFast | Makerkit | Supastarter | VybeKiit Web | VybeKiit Mobile |
|---------|----------|----------|-------------|--------------|-----------------|
| i18n framework (next-intl etc) | ❌ | ✅ | ✅ | | |
| Language switcher UI | ❌ | ✅ | ✅ | | |
| RTL layout support | ❌ | ❌ | ❌ | | |
| Translation files structure | ❌ | ✅ | ✅ | | |
| Multiple locale routing | ❌ | ✅ | ✅ | | |

---

## 10. TESTING & CI/CD

| Feature | ShipFast | Makerkit | Supastarter | VybeKiit Web | VybeKiit Mobile |
|---------|----------|----------|-------------|--------------|-----------------|
| Unit tests (Vitest) | ❌ | ✅ | ❌ | | |
| E2E tests (Playwright) | ❌ | ✅ | ❌ | | |
| CI pipeline (GitHub Actions) | ❌ | ❌ | ❌ | | |
| Pre-push git hooks (Husky) | ❌ | ❌ | ❌ | | |
| Linting (Biome/ESLint) | ❌ | ✅ (ESLint) | ✅ | | |
| Type-checking (strict TS) | ❌ | ✅ | ✅ | | |

---

## 11. DEPLOYMENT & INFRA

| Feature | ShipFast | Makerkit | Supastarter | VybeKiit Web | VybeKiit Mobile |
|---------|----------|----------|-------------|--------------|-----------------|
| Vercel deployment | ✅ | ✅ | ✅ | | N/A |
| Cloudflare Pages/Workers | ❌ | ✅ | ❌ | | N/A |
| Docker support | ❌ | ✅ | ❌ | | N/A |
| Self-hosting guide | ❌ | ✅ | ❌ | | N/A |
| Railway deployment | ❌ | ❌ | ❌ | | N/A |
| EAS Build (mobile) | N/A | N/A | N/A | N/A | |
| App Store submission guide | N/A | N/A | N/A | N/A | |
| OTA updates (EAS Update) | N/A | N/A | N/A | N/A | |

---

## 12. AI AGENT INTEGRATION 🎯

| Feature | ShipFast | Makerkit | Supastarter | VybeKiit |
|---------|----------|----------|-------------|----------|
| Claude Code rules/hooks | ❌ | ✅ (rules only) | ❌ | 🎯 35 runtime hooks |
| Cursor rules (.cursorrules) | ❌ | ✅ | ❌ | 🎯 .cursor/rules/vybekiit.mdc |
| Codex instructions (AGENTS.md) | ❌ | ✅ | ❌ | 🎯 |
| Gemini instructions (GEMINI.md) | ❌ | ✅ | ❌ | 🎯 |
| Copilot instructions | ❌ | ❌ | ❌ | 🎯 .github/copilot-instructions.md |
| Windsurf rules | ❌ | ✅ | ❌ | 🎯 .windsurfrules |
| Kiro steering | ❌ | ❌ | ❌ | 🎯 .kiro/steering/ |
| Cline hooks (runtime) | ❌ | ❌ | ❌ | 🎯 .clinerules/ |
| Kilo Code rules | ❌ | ❌ | ❌ | 🎯 .kilo/rules/ |
| Aider conventions | ❌ | ❌ | ❌ | 🎯 CONVENTIONS.md |
| Roo Code rules | ❌ | ❌ | ❌ | 🎯 .roo/rules.md |
| Augment guidelines | ❌ | ❌ | ❌ | 🎯 .augment-guidelines |
| Zed AI rules | ❌ | ❌ | ❌ | 🎯 .zed/rules.md |
| Junie guidelines | ❌ | ❌ | ❌ | 🎯 .junie/guidelines.md |
| MCP Server | ❌ | ✅ | ❌ | |
| Multi-platform CLI (detect+drop) | ❌ | ❌ | ❌ | 🎯 vybekiit drop/detect |
| Agent guardrails (block bad code) | ❌ | ❌ | ❌ | 🎯 Runtime enforcement |
| Auto-detect agent CLIs | ❌ | ❌ | ❌ | 🎯 detect-agents.sh |

---

## 13. MOBILE-SPECIFIC (VybeKiit Unique)

| Feature | ShipFast | Makerkit | Supastarter | VybeKiit Mobile |
|---------|----------|----------|-------------|-----------------|
| Expo (React Native) template | ❌ | ❌ (companion only) | ❌ | 🎯 |
| Expo Router (file-based nav) | N/A | N/A | N/A | |
| Push notifications setup | N/A | N/A | N/A | |
| App Store assets (icons/splash) | N/A | N/A | N/A | |
| Deep linking | N/A | N/A | N/A | |
| OTA updates (EAS Update) | N/A | N/A | N/A | |
| Auto Xcode/iOS toolchain install | N/A | N/A | N/A | 🎯 setup-mobile-env.sh |
| React Native companion kit | N/A | ✅ | N/A | 🎯 Full template |

---

## 14. BROWSER EXTENSION (VybeKiit Unique)

| Feature | ShipFast | Makerkit | Supastarter | VybeKiit Extension |
|---------|----------|----------|-------------|-------------------|
| WXT framework | N/A | N/A | N/A | 🎯 |
| Chrome + Firefox + Safari | N/A | N/A | N/A | |
| Content scripts | N/A | N/A | N/A | |
| Background workers | N/A | N/A | N/A | |
| Popup UI | N/A | N/A | N/A | |
| Store submission guide | N/A | N/A | N/A | |

---

## 15. DX & DEVELOPER EXPERIENCE

| Feature | ShipFast | Makerkit | Supastarter | VybeKiit |
|---------|----------|----------|-------------|----------|
| CLI tool (scaffold/drop) | ❌ | ❌ | ❌ | 🎯 vybekiit CLI |
| Interactive TUI setup | ❌ | ❌ | ❌ | 🎯 |
| Doctor (verify environment) | ❌ | ❌ | ❌ | 🎯 vybekiit doctor |
| Global npm install | ❌ | ❌ | ❌ | 🎯 npm i -g vybekiit |
| npx one-shot scaffold | ❌ | ❌ | ❌ | 🎯 npx vybekiit drop |
| Template auto-detection | ❌ | ❌ | ❌ | 🎯 |
| Skills/presets system | ❌ | ❌ | ❌ | 🎯 |
| Monorepo structure | ❌ | ✅ | ✅ | 🎯 |

---

## 16. SECURITY & COMPLIANCE

| Feature | ShipFast | Makerkit | Supastarter | VybeKiit |
|---------|----------|----------|-------------|----------|
| SECURITY.md | ❌ | ❌ | ❌ | 🎯 |
| Secret leak prevention (hooks) | ❌ | ❌ | ❌ | 🎯 |
| Block destructive DB operations | ❌ | ❌ | ❌ | 🎯 |
| Block force-push to main | ❌ | ❌ | ❌ | 🎯 |
| Block unknown dep installs | ❌ | ❌ | ❌ | 🎯 |
| Terms of service (ChatGPT gen) | ✅ | ❌ | ❌ | |
| Privacy policy template | ✅ | ❌ | ❌ | |
| GDPR compliance patterns | ❌ | ❌ | ❌ | |

---

## 17. REAL-TIME & NOTIFICATIONS

| Feature | ShipFast | Makerkit | Supastarter | VybeKiit |
|---------|----------|----------|-------------|----------|
| WebSocket/Realtime | ❌ | ✅ (Supabase) | ✅ | |
| Push notifications (web) | ❌ | ❌ | ❌ | |
| Push notifications (mobile) | N/A | N/A | N/A | |
| In-app notifications | ❌ | ✅ | ❌ | |
| Notification preferences | ❌ | ✅ | ❌ | |

---

## 18. FILE UPLOAD & STORAGE

| Feature | ShipFast | Makerkit | Supastarter | VybeKiit |
|---------|----------|----------|-------------|----------|
| File upload (S3/R2/Supabase) | ❌ | ✅ | ✅ | |
| Image optimization | ❌ | ❌ | ❌ | |
| Avatar upload | ❌ | ✅ | ✅ | |
| Presigned URLs | ❌ | ❌ | ❌ | |

---

## 19. MONITORING & OBSERVABILITY

| Feature | ShipFast | Makerkit | Supastarter | VybeKiit |
|---------|----------|----------|-------------|----------|
| Sentry error tracking | ❌ | ✅ | ❌ | |
| PostHog analytics | ❌ | ✅ | ✅ | |
| Structured logging | ❌ | ❌ | ❌ | |
| Health check endpoint | ❌ | ❌ | ❌ | |

---

## PRIORITY GAPS TO CLOSE (Sorted by Impact)

### P0 — Table stakes (buyers expect these)
1. **Authentication** — ✅ DONE (Email/password + OAuth + Magic Link + SMS OTP + MFA)
2. **Stripe billing** — ✅ DONE (Stripe + LemonSqueezy + PayPal, webhooks, customer portal)
3. **Landing page** — ✅ DONE (157 Tailark marketing blocks available)
4. **Database** — ✅ DONE (Supabase + Postgres, @vybekiit/db package)
5. **Transactional emails** — ✅ DONE (SES + Resend + Cloudflare, @vybekiit/email)

### P1 — Competitive parity
6. **Multi-tenancy** — ✅ DONE (@vybekiit/tenancy with BetterAuth + local providers)
7. **Admin panel** — ✅ DONE (Super Admin dashboard: users, billing, teams, revenue charts)
8. **Dark/Light theme** — ✅ DONE (next-themes + useTheme + theme-switcher)
9. **Blog** — ✅ DONE (app/[locale]/blog/ with dynamic [slug] routes)
10. **Analytics integration** — ✅ DONE (@vybekiit/analytics: PostHog + Plausible)

### P2 — Differentiation (already strong here)
11. **AI agent integration** — ✅ Already #1 in market (14 platforms, 35 hooks)
12. **Mobile template** — ✅ Unique (no competitor has Expo)
13. **Extension template** — ✅ Unique (no competitor has WXT)
14. **CLI tooling** — ✅ Unique (`vybekiit drop`, `detect`, `doctor`)
15. **Security guardrails** — ✅ Unique (runtime enforcement)

### P3 — Remaining opportunities
16. **MCP Server** — Makerkit has this, we should add
17. **Docker + self-hosting** — Add Dockerfile + docs
18. **Figma UI Kit** — Nice-to-have
19. **Privacy/GDPR templates** — Terms + Privacy pages exist, add cookie consent

---

## VybeKiit's UNIQUE VALUE (Competitors Can't Match)

| Advantage | Details |
|-----------|---------|
| **14-platform AI agent support** | Rules for ALL major AI coding tools, not just 3-4 |
| **35 runtime guardrail hooks** | Actually BLOCKS bad code at tool-call time |
| **5 template types** | Web, SPA, Mobile, Extension, Backend (competitors: 1-2) |
| **CLI with `drop` command** | Any agent can scaffold instantly: `vybekiit drop mobile .` |
| **Agent CLI detection** | Auto-detects which coding agents are installed |
| **Mobile-first template** | Full Expo with auto Xcode setup (nobody else has this) |
| **Browser extension template** | WXT (nobody else has this) |
| **Security-first** | SECURITY.md + secret prevention + destructive op blocking |
| **Effect-first stack** | @effect/schema, not Zod (more powerful, same bundle) |
