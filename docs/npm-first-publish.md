# npm first publish (operator)

Requires npm login with 2FA. Run locally — CI uses OIDC after Trusted Publishers are registered.

## One-time publish (creates packages on npm)

```bash
cd vybekiit
pnpm install && pnpm build
pnpm publish:packages:dry-run
pnpm publish:packages          # enter OTP when prompted
cd cli && pnpm publish --access public --no-git-checks
```

## Register Trusted Publishers

For each of 25 packages (`@vybekiit/core` … `@vybekiit/cms`, plus `vybekiit`):

1. npmjs.com → package → Settings → **Trusted Publisher**
2. GitHub Actions → Owner: `VybeKiit`, Repo: `vybekiit`, Workflow: `publish.yml`

## Verify

```bash
npm view @vybekiit/core version
npx vybekiit --help
```

Future releases: merge PR → `Release` workflow → `publish.yml` (no OTP).
