# Skill: save-data

**Goal:** the extension remembers things via the builder's backend.

**Contract:** one action at a time · verify-before-advance · plain language · celebrate.

> (Agent-only) No database in the extension — calls backend API. Web `save-data` must be wired first.

## Steps

1. **Backend data ready.** Web app must persist data. Run web `save-data` if needed.
   **Verify:** backend read/write works.

2. **Wire extension API client.** Replace `TODO(vybekiit): … — skill: save-data` markers.
   **Verify:** extension saves and loads a test value through the backend.

## Definition of done

Extension reads/writes data through the deployed backend only.
