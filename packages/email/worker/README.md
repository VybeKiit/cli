# VybeKiit email worker

Deployable Cloudflare Worker for transactional email. The handler lives in `@vybekiit/email` (`createEmailWorkerHandler`); this folder is only wrangler config + entry.

## Quick setup

1. Copy root `.env.example` → `.env` and fill:

   ```bash
   EMAIL_WORKER_SECRET=           # openssl rand -hex 32
   CLOUDFLARE_EMAIL_ENDPOINT=     # set after deploy (step 4)
   EMAIL_FROM=hello@yourdomain.com
   EMAIL_FROM_NAME=Your App
   CLOUDFLARE_ACCOUNT_ID=
   ```

2. Add your domain to Cloudflare and point Namecheap (or your registrar) nameservers at Cloudflare.

3. Enable Email Sending:

   ```bash
   npx wrangler email sending enable yourdomain.com
   ```

4. Deploy this worker (from this directory):

   ```bash
   npm install
   npx wrangler secret put EMAIL_WORKER_SECRET   # same value as .env
   CLOUDFLARE_ACCOUNT_ID=... npm run deploy
   ```

   Set `ALLOWED_SENDER_DOMAINS` and `DEFAULT_FROM_*` in `wrangler.jsonc` for your domain.

5. Put the worker URL in root `.env`:

   ```bash
   CLOUDFLARE_EMAIL_ENDPOINT=https://vybekiit-email.<subdomain>.workers.dev/send
   ```

6. Send a test from the monorepo root:

   ```bash
   pnpm email:test-send you@example.com
   ```

## App integration

Apps call `resolveEmailProvider()` from `@vybekiit/email` — never POST to the worker directly.
