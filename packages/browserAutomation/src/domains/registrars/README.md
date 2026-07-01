# Registrar browser-automation

Credential onboarding for domain registrars — **API key setup only** (ADR-0021).

| Target | Alias | Profile | Dashboard |
|--------|-------|---------|-----------|
| `registrars/namecheap` | `nc` | `~/.nc-chrome-profile` | Namecheap API Access |
| `registrars/godaddy` | `gd` | `~/.gd-chrome-profile` | GoDaddy Developer Keys |

```bash
vybekiit-automate nc setup --json [--sandbox] [--cdp=http://127.0.0.1:9223]
vybekiit-automate gd setup --json [--production] [--name=vybekiit] [--cdp=http://127.0.0.1:9224]
```

`setup` waits for sign-in and continues automatically on redirect (no re-run). Optional `standby` only checks readiness.

Parallel verify: `bash packages/browserAutomation/scripts/operator-registrar-verify.sh`

Nameserver delegation stays in `@vybekiit/deploy` REST clients — not browser automation.
