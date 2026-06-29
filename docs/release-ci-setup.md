# Release CI setup (operator)

Release → `publish.yml` ships npm packages. Mirror sync is separate and must not block npm.

## 1. `GH_MIRROR_TOKEN` (mirror sync in CI)

The default `GITHUB_TOKEN` can only write to **this** repo. Mirror force-pushes need a PAT.

### Create the token

1. GitHub → **Settings → Developer settings → Fine-grained tokens → Generate**
2. **Resource owner:** `VybeKiit`
3. **Repository access:** Only select repositories → `web`, `mobile`, `extension`, `cli`, `infra`
4. **Permissions → Repository → Contents:** Read and write
5. Generate and copy the token

### Add the secret

```bash
gh secret set GH_MIRROR_TOKEN --repo VybeKiit/vybekiit
# paste token when prompted
```

Or: repo **Settings → Secrets and variables → Actions → New repository secret** → name `GH_MIRROR_TOKEN`.

### Verify

```bash
gh workflow run mirror-repos.yml --repo VybeKiit/vybekiit
gh run list --repo VybeKiit/vybekiit --workflow mirror-repos.yml --limit 1
```

Local pushes use `gh auth login` via the pre-push hook — no secret needed on your machine.

## 2. npm Trusted Publishers

See [npm-first-publish.md](./npm-first-publish.md). Required for OIDC publish (no OTP in CI).

## 3. Release flow (after setup)

```
merge PR → Release workflow
  → bump semver (patch unless minor/major label)
  → tag vX.Y.Z on monorepo
  → GitHub Release (monorepo)
  → publish.yml → npm @vybekiit/* + vybekiit CLI
  → mirror sync (non-blocking if token missing)
```

Skip release on a PR: add label `no-release`.

## 4. Manual publish (fallback)

If CI publish fails but packages exist on npm:

```bash
cd vybekiit
pnpm install && pnpm build
pnpm publish:packages          # OTP
cd cli && pnpm publish --access public --no-git-checks
```

Or trigger **Publish Package** workflow (`workflow_dispatch`) after a tag exists on main.

## 5. README-only npm update

npm cannot overwrite an existing version. Doc-only changes need a **patch bump** (e.g. `0.1.0` → `0.1.1`) via the Release workflow.
