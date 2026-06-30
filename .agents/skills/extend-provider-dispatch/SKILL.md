---
name: extend-provider-dispatch
description: >-
  Maintainer-only — add or change a *_PROVIDER adapter, doctor toolchain entry,
  or env-gated fallback. Use before touching packages/*/src/resolve.ts or
  cli/src/doctor/toolchain.ts. Enforces ADR-0018 dispatch SSOT.
---

# Extend provider dispatch (maintainer)

**Audience:** agents working on the VybeKiit monorepo (`packages/*`, `cli/`). Not
buyer-facing — mistakes here ship to vibe coders via npm and `doctor`.

## When to use

- Adding or changing a `*_PROVIDER` adapter
- Editing `selectToolchain` or any `resolve.ts`
- Lifting a shared env signal used in 2+ packages

## Never

- Nested ternary dispatch on provider keys
- Raw `env.HOSTING_PROVIDER === '…'` (use `parseEnv` + schemas in `@vybekiit/core`)
- A second copy of Railway/AWS/Cloudflare unconfigured checks — import from core
- A new `switch` on `*_PROVIDER` in `resolve.ts`

## Always (ADR-0018)

1. **Keys:** `parseEnv(<schema>, env)` from `@vybekiit/core` (schemas in `config.ts`)
2. **Dispatch:** `resolveEnvProvider(key, registry, env, defaultKey)` — new adapter = registry entry
3. **Optional output** (no CLI / no adapter): `resolveOptionalEnvProvider` (doctor data tools)
4. **Shared signals** in `packages/core/src/provider-dispatch.ts`:
   - `isCloudflareUnconfigured`, `isSupabaseUnconfigured`
   - `isRailwayStackActive`, `needsAwsCliFromAuxiliaryProviders`

## Reference implementation

Read `packages/payments/src/resolve.ts` before writing any resolver.

```typescript
const { PAYMENTS_PROVIDER } = parseEnv(paymentsConfigSchema, env);
return resolveEnvProvider(
  PAYMENTS_PROVIDER,
  {
    stripe: (source) => createStripeProvider(parseEnv(stripeConfigSchema, source)),
    // …
  },
  env,
  'lemon-squeezy',
);
```

## Package-specific pre-checks (allowed)

Keep **before** dispatch when domain-specific (ADR-0008):

- `isDataUnconfigured` in `@vybekiit/db`
- `isAuthUnconfigured` in `@vybekiit/auth`
- Unconfigured fallbacks inside registry factories (e.g. KV → local when CF creds missing)

Do not add parallel switch trees for the same provider key.

## Doctor planner (`selectToolchain`)

Must read as a linear pipeline (~5 seconds):

`GH → hosting tool (registry) → Railway if decoupled → data tool (optional registry) → AWS auxiliary → gcloud → mobile`

## Verification

```bash
pnpm --filter @vybekiit/core build && pnpm --filter @vybekiit/core test
cd packages/<pkg> && pnpm test
cd cli && pnpm test -- doctor.test.ts
node scripts/check-provider-dispatch.mjs
```

## Docs

- ADR-0018 — Provider dispatch SSOT
- ADR-0002 — Multi-provider adapters
