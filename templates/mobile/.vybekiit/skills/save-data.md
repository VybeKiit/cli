# Skill: save-data

**Goal:** the app can remember things — save information and read it back later.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate. You do all the wiring; the builder only describes, in plain words,
what the app should remember.

> (Under the hood — agent-only) A phone can't safely hold a database connection, so the app never
> talks to the database directly — it reads and writes through the **backend** (the web app) over
> `APP_URL`, using `getJson` / `postJson` from `src/lib/fetch-json.ts`. The backend owns the database
> wiring (its own save-data skill does that). Never name the database service to the builder.

## Steps

1. **Make sure the backend can remember things first.** Saving happens on the builder's web app. If
   the web side doesn't have a database set up yet, run the **web** save-data skill over there first,
   then come back.
   **Verify:** the backend's save/read works, and `APP_URL` in `.env` points at that deployed backend.

2. **Agree on what to remember, in plain words.** Ask the builder what the app should save (e.g.
   "each note's title and text"). Turn their answer into a simple data shape yourself — don't make
   them think about it.
   **Verify:** read the shape back to them in one sentence and get a yes.

3. **Wire saving and reading.** Add the backend endpoints that store and return the data, then call
   them from the app through `getJson` / `postJson`. Replace the dashboard's placeholder stats marker
   (`TODO(vybekiit): … — skill: save-data`; grep them) with a real read from the backend.
   **Verify:** the code builds with no errors.

4. **Write a test** that saves a record and reads it back, and keep it green.

5. **Try it for real on the phone.** Save something in the app, then read it back.
   **Verify:** what was saved comes back exactly, on the device.
   🎉 *Celebrate* — the app remembers things now.

## If anything breaks

Run `doctor`. The usual causes are the backend address (`APP_URL`) not pointing at the deployed web
app, or the backend not having a database yet — fix the one cause for them, don't explain the
internals.

## Definition of done

The app saves and reads back real data through the backend, a passing test covers it, and no
save-data markers remain (re-grep `TODO(vybekiit)`).
