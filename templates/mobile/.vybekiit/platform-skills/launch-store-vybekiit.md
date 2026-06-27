# Platform wrapper: launch-store (mobile publish)

**Agent-only.** Invoked by buyer skill `publish-app`.

## Official upstream

- CLI: `launch-store` (global npm; `doctor` installs as `launch`)
- Build engine: EAS — prefer pinned `.agents/skills/expo-deployment` and `expo-cicd-workflows`
- Docs: https://docs.expo.dev/submit/introduction/

## Kit wiring

1. App identity in `app.json`; listing in `launch.config.ts` (`buildEngine: 'eas'`)
2. Resolve `TODO(vybekiit): … — skill: publish-app` markers first
3. `launch build <ios|android>` — cloud build + test track upload
4. `launch release <ios|android>` — public store submit
5. `launch status` — review state
6. Mobile app talks to **backend API** for auth/data/payments — never direct DB keys in the app

## Verify-before-advance

- `eas whoami` + `launch --version` via `doctor`
- Build completes green before submit
- Store confirms submission received
