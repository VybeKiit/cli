# Platform skills — mobile template (agent-only)

Layer B execution knowledge. The builder never sees these files.

## Pinned official skills

Full Expo suite in `.agents/skills/` (from https://github.com/expo/skills):

```bash
npx skills add expo/skills --skill '*' -y
```

Expo docs remain source of truth: https://docs.expo.dev/skills/

## Wrapper index

| Wrapper | Invoked by buyer skill | Official upstream |
|---|---|---|
| `launch-store-vybekiit.md` | `publish-app` | launch-store npm CLI + `expo-deployment` skill |
| `code-hygiene-vybekiit.md` | generic coding (invisible) | DRY/SSOT/check-before-create guardrails |
| `planning-vybekiit.md` | `plan-my-idea` | CONTEXT.md format; no ADRs for buyers |
| `observability-vybekiit.md` | generic coding + `track-errors` | `@vybekiit/core` logger + `@vybekiit/observability` |
| `sentry-vybekiit.md` | `track-errors` | docs.sentry.io + `@vybekiit/observability` |
| `ui-consistency-vybekiit.md` | generic UI work | `.vybekiit/agent/ui-sources.mobile.md` + kit primitives |
| `ui-port-from-web-vybekiit.md` | generic UI work | web mirror catalog + StyleSheet port rules |
| `testing-vybekiit.md` | generic coding (invisible) | vitest patterns in `src/**/__tests__/` |
| `format-lint-vybekiit.md` | generic coding (invisible) | Biome — `pnpm format` / `pnpm lint` |
| `react-patterns-vybekiit.md` | generic coding (invisible) | kit hooks, FormField, folder map |
| `github-vybekiit.md` | `back-up-my-code` | `gh` auth, private repo, push |
| `ci-vybekiit.md` | push / PR flow (invisible) | `.github/workflows/ci.yml` online checker |
| `ship-via-pr-vybekiit.md` | save progress | worktree → PR → CI → merge |
| `i18n-vybekiit.md` | generic UI / `add-language` | expo-localization + i18n-js + `messages/` |
| `env-secrets-vybekiit.md` | secret handling | `.cursorignore`, never echo `.env` |
| Expo pinned skills | onboarding, UI, builds | expo/skills (auto-discovered) |

## Google sign-in (Expo)

Mobile Google OAuth is **native** — use Expo Auth Session + Google provider, then send the token to
your backend verifier (same as web). Source of truth:

- https://docs.expo.dev/guides/google-authentication/
- Skill: `.vybekiit/skills/sign-in-with-google.md`
- Env: `GOOGLE_OAUTH_*` on the **backend** `.env`, not in the mobile bundle
