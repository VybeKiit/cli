# CONTEXT — CWS Automation

Root vocabulary lives in `../../CONTEXT.md`. This file only defines package-local terms.

## Glossary

| Term | Meaning |
|---|---|
| **CWS automation package** | Tooling package that drives Chrome Web Store Developer Console workflows through Playwright/CDP. |
| **CWS verb** | Allowed operation exported by the package facade and registered in the verb registry. |
| **Read verb** | CWS verb that only reads Developer Console state. |
| **Push verb** | CWS verb that mutates Developer Console state after release verification. |
| **Selector registry** | Dated selector source used by verbs to find CWS controls. |
| **Safe click** | Guarded click helper that refuses destructive accessible names. |
| **Listing source** | Extension-owned `cws-listing.ts` file used as the intended store listing state. |
| **Listing drift** | Difference between the listing source and live CWS state. |
| **CWS Chrome profile** | Dedicated Chrome profile at `$HOME/.cws-chrome-profile` used for Chrome Web Store UI automation. |
| **Attached session** | Browser automation session connected to the CWS Chrome profile through CDP. |
| **Verify gate** | Package-level release check run before push verbs touch CWS. |
