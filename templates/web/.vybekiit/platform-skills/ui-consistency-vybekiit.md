# Platform wrapper: UI consistency (agent-only)

**Agent-only.** Professional, symmetric UI — not a buyer goal skill.

## Catalog

Web/extension: `.vybekiit/agent/ui-sources.md` · routing: `ui-routing-vybekiit.md`  
Mobile: `.vybekiit/agent/ui-sources.mobile.md` · porting: `ui-port-from-web-vybekiit.md`

## Non-negotiable contract

1. **Primitive-first** — `Button`, `Input`, `Card`, … from `src/components/ui/` for standard controls in buyer screens
2. **Namespace mirrors** — upstream copies live in `bundui/`, `magicui/`, `kokonutui/`, `aceternity/`, `untitled/`, `gluestack/`, `blocks/21st/` — never merge into `ui/` wholesale
3. **Locked size scale** — `sm | default | lg | icon` only in buyer-facing screens
4. **Token SSOT** — semantic colors from `@vybekiit/tokens` CSS vars
5. **Normalize on import** — when composing screens from mirrored blocks, swap controls to kit primitives + token colors
6. **One visual voice per screen** — one effect-library flavor per marketing page
7. **No second design system** — HeroUI, MUI, Chakra forbidden; Untitled/Gluestack isolated in their namespaces

## Normalize-on-import workflow

1. Pick block via MCP `suggest_ui_blend` or search local mirror
2. Copy/adapt into `app/` or `src/components/<feature>/`
3. `rg '<button|<input' <file>` — replace with kit components
4. Map colors to CSS variables / theme tokens
5. Strip conflicting Tailwind size classes
6. Preview in dev — confirm buttons match existing screens
7. Run UI checks from `check-safety` step 7

## Cross-refs

- `shadcn-vybekiit.md` — kit component conventions
- `ui-routing-vybekiit.md` — intent → source mapping
- `code-hygiene-vybekiit.md` — no duplicate helpers in UI code
