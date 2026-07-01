# Platform wrapper: registrar credential setup

**Agent-only.** Browser automation for Namecheap and GoDaddy API key onboarding when the builder's domain is at that registrar and nameserver automation is desired.

## When to use

During `buy-domain`, if Namecheap or GoDaddy secret settings are missing and the builder registered their domain there, run credential setup before Cloudflare nameserver delegation.

## Commands

Chrome with CDP on port 9222 and the target profile (see `browser-automation-vybekiit.md`).

```bash
# Namecheap — Profile → Tools → API Access
vybekiit-automate nc standby --json
vybekiit-automate nc setup --json
vybekiit-automate nc setup --json --sandbox   # sandbox API

# GoDaddy — developer.godaddy.com/keys (OTE by default)
vybekiit-automate gd standby --json
vybekiit-automate gd setup --json
vybekiit-automate gd setup --json --production
vybekiit-automate gd setup --json --name=vybekiit
```

On success, write the returned `env` keys to `.env`, then run `vybekiit doctor` to confirm.

## Rules

- Builder **signs in only**; agent runs setup and verification.
- Never say "Namecheap API", "GoDaddy Developer", or "whitelist IP" to the builder — use plain language from `language.md`.
- Nameserver updates use `@vybekiit/deploy` REST after credentials exist — not browser automation.

## Package

`@vybekiit/browser-automation` — ADR-0021.
