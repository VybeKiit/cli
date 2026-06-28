# VybeKiit licensing

This repository is **dual-licensed by component**, matching the Owned vs Maintained split (see
`CONTEXT.md`). Which license applies depends only on the path:

| Path | License | Why |
|---|---|---|
| `packages/*` (published `@vybekiit/*`) | **MIT** | Public, headless logic — free updates double as marketing; nothing secret here. |
| `cli/` (the published `vybekiit` scaffolder) | **MIT** | The public npm CLI anyone may `npx`; the paid gate is repo access, not the CLI itself. |
| `templates/*` + the buyer agent layer (`.vybekiit/`, and each template's `AGENTS.md` / `CLAUDE.md` / `.cursor/rules` / `language.md` / `BUILDER-VOICE.md`) | **Proprietary — VybeKiit EULA** | The paid, owned product. Full terms in [`EULA.md`](./EULA.md). |
| `apps/landing/`, root tooling/config, and other repo internals | Proprietary (not distributed) | Our store and build infrastructure — never shipped to a buyer. |

The MIT-licensed paths are the only parts published to public npm. The proprietary paths reach
buyers through private GitHub mirror repos after purchase (the gate) and are governed by the
[VybeKiit EULA](./EULA.md), which includes a plain-language summary of what a buyer can and can't do.

---

## MIT License — applies to `packages/*` and `cli/`

Copyright (c) 2026 VybeKiit authors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
associated documentation files (the "Software"), to deal in the Software without restriction,
including without limitation the rights to use, copy, modify, merge, publish, distribute,
sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial
portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---

## Proprietary — applies to `templates/*` and the buyer agent layer

These paths are **not** open source. They are the paid product, licensed (not sold) to buyers under
the **[VybeKiit EULA](./EULA.md)**. In short: a buyer may build unlimited products of their own,
including commercial ones, but may **not** redistribute, resell, or republish the kit itself, build a
competing kit with it, or share their access. Provided as-is, no warranty, liability capped at the
amount paid, best-effort updates with no compatibility guarantee. See `EULA.md` for the full terms
and the plain-language buyer summary.
