# Discord + kit email setup

Before first cold email.

## Discord

1. Create server (e.g. "VybeKiit Community")
2. Pin rules channel with kit-only boundary (from CONTEXT.md):
   - We fix the **kit** (templates, `@vybekiit/*` packages, agent skills)
   - We do **not** debug your custom code or agent output
   - First line: your agent + `doctor` skill
3. Create invite link (never expires, optional approval)
4. Set `SUPPORT.discordUrl` in [`apps/landing/src/data/site.ts`](../../apps/landing/src/data/site.ts)

## Kit email

1. Create alias (e.g. `support@vybekiit.com` or forwarding to your inbox)
2. Set `SUPPORT.kitEmail` in `site.ts` (default: `support@vybekiit.com`)
3. Auto-reply (optional): "Kit bugs only — include your GitHub username and what skill you were running."

## Post-purchase

Success page links both channels. Onboarding skill welcome can mention Discord after first win.
