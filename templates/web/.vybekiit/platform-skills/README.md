# Platform skills — web template (agent-only)

Layer B execution knowledge. The builder never sees these files — buyer skills in
`../skills/` invoke them under the hood.

## Source-of-truth hierarchy

1. Buyer `AGENTS.md` + `language.md` + goal skills
2. `@vybekiit/*` package interfaces
3. Official platform docs (API facts win)
4. Pinned official skills in `.agents/skills/`
5. These VybeKiit wrappers (kit wiring only)

## Pinned official skills

Installed into `.agents/skills/`:

```bash
npx skills add vercel-labs/agent-skills \
  --skill vercel-react-best-practices \
  --skill vercel-composition-patterns -y
```

Cloudflare plugin skills may live globally on the maintainer machine or be pinned the same way
when the buyer selects Cloudflare hosting (default).

## Wrapper index

| Wrapper | Invoked by buyer skill | Official upstream |
|---|---|---|
| `nextjs-vybekiit.md` | generic coding / layouts | vercel-labs Next.js skills + nextjs.org/docs |
| `shadcn-vybekiit.md` | generic UI work | ui.shadcn.com + kit `src/components` |
| `deploy-cloudflare-vybekiit.md` | `go-live` (default) | developers.cloudflare.com + wrangler |
| `deploy-vercel-vybekiit.md` | `go-live` when `HOSTING_PROVIDER=vercel` | vercel.com/docs + vercel CLI |
| `supabase-vybekiit.md` | `save-data`, `doctor` | supabase.com/docs + supabase CLI |
| `better-auth-vybekiit.md` | `add-signin` | better-auth.com/docs + `@vybekiit/auth` |
| `lemon-squeezy-vybekiit.md` | `setup-payments` (default) | docs.lemonsqueezy.com + `@vybekiit/payments` |
| `stripe-vybekiit.md` | `setup-payments` when `PAYMENTS_PROVIDER=stripe` | docs.stripe.com + `@vybekiit/payments` |
| `paypal-vybekiit.md` | `setup-payments` when `PAYMENTS_PROVIDER=paypal` | developer.paypal.com + `@vybekiit/payments` |
| `resend-vybekiit.md` | `setup-email` when `EMAIL_PROVIDER=resend` | resend.com/docs + `@vybekiit/email` |
| `ses-vybekiit.md` | `setup-email` when `EMAIL_PROVIDER=ses` | docs.aws.amazon.com/ses + `@vybekiit/email` |
