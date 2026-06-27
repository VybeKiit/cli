# Skill: setup-payments

**Goal:** the extension can take money (via the backend checkout flow).

**Contract:** one action at a time · verify-before-advance · plain language · celebrate.

> (Agent-only) Payments and keys stay on the backend. Extension opens hosted checkout in a tab.

## Steps

1. **Backend payments ready.** Run web `setup-payments` first if checkout isn't live.
   **Verify:** web checkout completes a test purchase.

2. **Wire extension checkout entry.** Replace `TODO(vybekiit): … — skill: setup-payments` — open
   backend checkout URL from the extension UI.
   **Verify:** test checkout opens and completes.

## Definition of done

Builder can start a purchase from the extension; money flows through the backend.
