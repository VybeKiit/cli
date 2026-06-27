# apps/landing — the VybeKiit store

> **v1.0 build target.** Not yet a workspace member (see `pnpm-workspace.yaml`).

Our own marketing + checkout site. It is **dogfooded from `templates/web`** — the same template
we sell — so the landing page is itself proof the kit works. The only store-specific addition over
the template is **the gate**:

- `lib/gate.ts` — invite/remove a buyer on the private repo via the GitHub API.
- `app/api/webhook/route.ts` — Lemon Squeezy webhook → the gate (paid → invite, refund → remove).

This is the v1.0 keystone: *a stranger pays → gets invited → scaffolds a web app → wires payments
→ deploys live.* De-risk this pipeline first (see `CONTEXT.md` → Build order).

## Building it (v1.0 phase)

1. Scaffold from the template: `vybekiit new web apps/landing` (or copy `templates/web`).
2. Promote it to a workspace member (add `apps/*` back to `pnpm-workspace.yaml`).
3. Keep `lib/gate.ts` + the webhook route above; wire the checkout to the kit's LS variant.
4. Deploy to Cloudflare Pages.
