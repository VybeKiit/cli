# Platform wrapper: Cloudflare email (default sender)

**Agent-only.** Invoked by buyer skill `setup-email` when `EMAIL_PROVIDER=cloudflare` (default).

## Official upstream

- Docs: https://developers.cloudflare.com/email-service/
- Pinned skills: `.agents/skills/wrangler/SKILL.md`, `.agents/skills/cloudflare-email-service/SKILL.md`

## Kit wiring

1. Email via `@/vybekiit/email` → `resolveEmailProvider()` when `EMAIL_PROVIDER=cloudflare`
2. Deploy the Cloudflare email worker (a small `fetch` handler that receives the POST from
   `createCloudflareEmail` and calls the Email Sending binding); point `CLOUDFLARE_EMAIL_ENDPOINT` at it
3. Root `.env` keys:

   ```bash
   EMAIL_WORKER_SECRET=              # wrangler secret on the worker
   CLOUDFLARE_EMAIL_ENDPOINT=        # https://<worker>.workers.dev/send
   EMAIL_FROM=hello@yourdomain.com
   EMAIL_FROM_NAME=Your App
   CLOUDFLARE_ACCOUNT_ID=
   CLOUDFLARE_API_TOKEN=             # deploy + zone provisioning only
   ```

4. Optional Namecheap automation (registrar NS update):

   ```bash
   NAMECHEAP_API_USER=
   NAMECHEAP_API_KEY=
   NAMECHEAP_CLIENT_IP=
   ```

5. Domain provisioning: `DOMAIN=yourdomain.com node infra/scripts/provisionDomain.mjs`
6. Enable sending: `npx wrangler email sending enable yourdomain.com`
7. Test: trigger a real send from the app (e.g. a sign-in email) and confirm it arrives

## Verify-before-advance

- `vybekiit doctor` — Namecheap + email worker health when configured
- Test email arrives (check spam)
- Apps call `resolveEmailProvider()` — never POST to the worker directly
