# Skill: add-notifications

**Goal:** users get notified when something important happens.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate.

> (Under the hood — agent-only) Email notifications run on the **backend**. Run **web**
> `setup-email` + `add-notifications` first. The extension can show in-app toasts when the backend
> tells it something new — no secrets in the add-on.

## Steps

1. **Backend notifications first.** Run **web** `add-notifications` on the deployed backend.
   **Verify:** email sends on the agreed trigger.

2. **Optional in-app alerts.** Poll or listen for backend events and show a plain message in the
   popup when appropriate.
   **Verify:** user sees the alert in the add-on preview.

## Definition of done

Users get notified via backend email; optional in-app message in the extension.
