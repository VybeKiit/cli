# Platform wrapper: AWS SES (opt-in email)

**Agent-only.** Invoked by buyer skill `setup-email` when `EMAIL_PROVIDER=ses`.

## Official upstream

- Docs: https://docs.aws.amazon.com/ses/

## Kit wiring

1. Email via `@vybekiit/email` → `resolveEmailProvider()` when `EMAIL_PROVIDER=ses`
2. Set AWS credentials and verified sender domain/address in `.env`
3. Wire sending through the provider interface; hook into sign-in codes, welcome, receipts as needed
4. Replace any `TODO(vybekiit): … — skill: setup-email` markers

## Verify-before-advance

- Send test email to builder; confirm arrival (check spam)
- Sender domain verified in the provider console before go-live
