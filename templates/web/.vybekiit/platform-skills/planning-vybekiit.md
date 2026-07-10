# planning-vybekiit.md — agent-only planning mechanics

Used by `plan-my-idea.md`. The builder never sees this file or its vocabulary.

## CONTEXT.md format

Single context at repo root (`CONTEXT.md`). Create lazily when the first term resolves.

```md
# {App name or domain}

{One or two sentences: what this app is and who it's for.}

## Language

**{Canonical term}**:
{A one or two sentence definition of what it IS, not what it does.}
_Avoid_: alias1, alias2
```

### Rules

- **Be opinionated.** Pick one canonical word; list alternatives under `_Avoid_`.
- **Keep definitions tight.** One or two sentences max.
- **App-specific only.** No general programming terms (API, timeout, cache, component).
- **Group under subheadings** when clusters emerge (e.g. `## People`, `## Money`).
- **Update inline** during the session — never batch at the end.
- **No implementation details** in `CONTEXT.md` — glossary only, not a spec.

### No ADRs for buyers

Do not create `docs/adr/` or decision-record files. Capture agreed language in `CONTEXT.md` only.

## During a planning session

### Challenge against the glossary

When the builder uses a term that conflicts with `CONTEXT.md`, reconcile immediately: *"Last time we
said X means … — is that still right?"*

### Sharpen fuzzy language

When they say "account", "user", "order", "save" without precision, propose a canonical term and ask
which they mean.

### Cross-reference with code

When they state how something works, check the code. If it contradicts them, surface it plainly and
ask which is right before continuing.

### Concrete scenarios

Once the shape emerges, invent one realistic edge-case scenario (*"Sarah tries to… what happens?"*) to
expose gaps before building.

## After planning

Reference `CONTEXT.md` during later feature work so wording stays consistent. Do not overwrite buyer
entries during `update-kit` sync — `CONTEXT.md` is buyer-owned.
