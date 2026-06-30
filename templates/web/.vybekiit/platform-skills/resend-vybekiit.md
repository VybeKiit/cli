# Platform wrapper: Resend (opt-in email)

**Agent-only.** Invoked by buyer skill `setup-email` when `EMAIL_PROVIDER=resend`.

## Official upstream

- Docs: https://resend.com/docs
- Pinned skills: `.agents/skills/resend/SKILL.md`, `.agents/skills/email-best-practices/SKILL.md`

## Kit wiring

1. Email via `@vybekiit/email` → `resolveEmailProvider()` when `EMAIL_PROVIDER=resend`
2. Set `RESEND_API_KEY` and verified sender in `.env`
3. Wire sending through the provider interface; hook into sign-in codes, welcome, receipts as needed
4. Replace any `TODO(vybekiit): … — skill: setup-email` markers

## Verify-before-advance

- Send test email to builder; confirm arrival (check spam)
- Connected flow sends in the skill's target moment
