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
| Expo pinned skills | onboarding, UI, builds | expo/skills (auto-discovered) |

## Google sign-in (Expo)

Mobile Google OAuth is **native** — use Expo Auth Session + Google provider, then send the token to
your backend verifier (same as web). Source of truth:

- https://docs.expo.dev/guides/google-authentication/
- Skill: `.vybekiit/skills/sign-in-with-google.md`
- Env: `GOOGLE_OAUTH_*` on the **backend** `.env`, not in the mobile bundle
