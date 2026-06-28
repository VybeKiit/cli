# Skill: check-safety

**Goal:** confirm the app is protected end-to-end before ship — abuse, database safety, and every
API route classified correctly. Output a plain pass/fail summary for the builder.

**Contract:** one action at a time · verify-before-advance · plain language · celebrate when green.

## Steps

1. **Abuse / DDoS layer.** Confirm `SECURITY_RATE_LIMIT` and `SECURITY_ORIGIN_LOCK` are `on` in
   `.env`. Confirm `middleware.ts` passes the request path for tiered limits. Confirm `/api/webhook`
   is **not** blocked by origin lock (payment providers POST cross-origin). Run quick probes: hammer
   `/api/auth/signin` → expect "slow down"; submit `/api/contact` at human pace → still works.
   **Verify:** login protected; contact form not throttled like login.

2. **SQL / database safety.** Grep for raw SQL, `$executeRaw`, or string-built queries — replace with
   `@vybekiit/db` `DataProvider`. If Supabase: confirm RLS on buyer tables. Every API route validates
   input with zod at the boundary.
   **Verify:** no raw SQL in app code; DataProvider-only data access.

3. **Endpoint taxonomy.** Audit every `/api/*` route:
   - Public forms (contact, waitlist) → lenient limit, no session
   - Auth routes → strict limit
   - Webhooks → signature verified, origin lock off
   - `/api/me` and user data → session required
   - Admin / bulk export → must not exist without auth
   **Verify:** each route matches the table; fix misclassified routes.

4. **Toolchain.** Run `vybekiit doctor` — agent CLIs, cloud CLIs, platform skills present.
   If Google sign-in was requested: `GOOGLE_OAUTH_*` populated, gcloud signed in.

5. **Edge (at go-live).** Confirm `infra/cloudflare/` edge worker uses the same `SECURITY_*` toggles.
   **Verify:** dual-layer protection documented in go-live.

## Definition of done

Plain-language summary: login protected, contact works, webhooks verified, database safe, doctor green.
🎉 *Celebrate* when all layers pass.
