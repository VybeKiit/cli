# Skill: add-files

**Goal:** users can upload files and images, and see them back in the app.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate. You build the upload; the builder only pastes a value when asked.

> (Under the hood — agent-only) Use `@vybekiit/db`'s `resolveStorageProvider()` for upload + read.
> After upload, display URLs from `resolveAssetDelivery().url()` — not raw `getUrl()` — so images
> are compressed and served via the kit's CDN layer. The default is Supabase Storage / R2 once
> doctor provisions Cloudflare; `s3` is opt-in via `STORAGE_PROVIDER`. Same skill, whichever
> is set — never name the service to the builder.

## Steps

1. **Make sure file storage is ready.** Run `vybekiit doctor` so the storage tool is set up, and
   collect any access key it needs — one at a time — into the secret settings file.
   **Verify:** storage is reachable (a tiny test upload succeeds).

2. **Add the upload UI + handler.** Build a simple "choose a file" control and a handler that sends
   the file through `resolveStorageProvider()`.
   **Verify:** the screen builds and shows the upload control.

3. **Show the uploaded file back.** After upload, display the image/file via
   `resolveAssetDelivery().url()` (use `VybeImage` for images) so the CDN serves an optimized variant.
   **Verify:** an uploaded file appears in the app.

4. **Write a test** for the upload handler, and keep it green.

5. **Try it for real.** Upload a real image and confirm it shows up.
   **Verify:** the file uploads and displays.
   🎉 *Celebrate* — users can share files now.

## If anything breaks

Run `doctor`. Most issues are a missing access key or storage not set up yet — fix it for them,
don't explain the internals.

## Definition of done

A real file uploads and displays, and a passing test covers the upload handler.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*

