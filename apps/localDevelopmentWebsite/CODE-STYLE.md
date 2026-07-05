# CODE-STYLE.md — VybeKiit Local Dev Console

The law. When code and this doc conflict, this doc wins. When taste and existing
code conflict, taste wins — fix the code.

## Canonical example

```typescript
// src/components/ChatInput.tsx
'use client';

import { Image, Link, Paperclip, Send } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Button, Input } from '@vybekiit/ui';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/stores';

type ChatInputProps = {
  conversationId: string;
  agentName: string;
  disabled?: boolean;
};

/**
 * @param conversationId - Active conversation to send messages to
 * @param agentName - Display name for placeholder text
 * @param disabled - Locks input when no conversation is active
 */
export const ChatInput = ({ conversationId, agentName, disabled = false }: ChatInputProps) => {
  const [text, setText] = useState('');
  const send = useChatStore((s) => s.addMessage);

  const submit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;

    send(conversationId, { role: 'user', content: trimmed });
    setText('');
  }, [disabled, send, conversationId, text]);

  return (
    <div className={cn('flex items-end gap-3 border-t border-zinc-800 bg-zinc-950/80 p-3 backdrop-blur')}>
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" aria-label="Attach file">
          <Paperclip className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Paste image">
          <Image className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Add URL">
          <Link className="h-4 w-4" />
        </Button>
      </div>

      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={`Message ${agentName}...`}
        disabled={disabled}
        className="min-h-[44px] flex-1 rounded-xl border-zinc-800 bg-zinc-900 py-3 text-sm"
      />

      <Button
        onClick={submit}
        disabled={disabled || !text.trim()}
        size="icon"
        className="h-11 w-11 rounded-xl bg-vybe-600 hover:bg-vybe-500"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
};
```

## Rules

### Components [lint: biome]

| Rule | ✓ Do | ✗ Don't |
|------|------|---------|
| Arrow const | `export const X = () => {}` | `export function X() {}` |
| Props type | `type XProps = { ... }` | `interface XProps { readonly ... }` |
| Destructure | `({ a, b }: Props) =>` | `(props: Props) =>` |
| Defaults | `disabled = false` in params | `disabled ?? false` in body |

### Imports & Exports [lint: biome organizeImports]

| Rule | ✓ Do | ✗ Don't |
|------|------|---------|
| Group | `import { A, B, C } from 'x'` | Separate lines from same source |
| Inline export | `export const x = () => {}` | Bottom `export { }` block |
| Barrels | `index.ts` per directory | Direct file path imports |
| Order | React → external → @/ → relative | Random |

### Styling [lint: biome useSortedClasses]

| Rule | ✓ Do | ✗ Don't |
|------|------|---------|
| Dynamic classes | `cn('base', condition && 'extra')` | Template literals for dynamic |
| Static classes | `className="flex h-screen"` | `cn()` with no logic |
| Variables | `cn('base', agent.glow)` | `` `base ${agent.glow}` `` |

### State [taste]

| Rule | ✓ Do | ✗ Don't |
|------|------|---------|
| Store | Zustand + persist middleware | Custom pub/sub |
| Hook (store) | `useChatStore((s) => s.x)` | useState + useEffect + subscribe |
| Hook (non-store) | Custom hook with useState/useEffect | Inline in component |
| Keys | Centralized `lib/keys.ts` | Per-file constants |

### Architecture [taste]

| Rule | ✓ Do | ✗ Don't |
|------|------|---------|
| Composition | Components render, hooks think | 50+ lines of logic in component |
| Extract at | 50 lines of logic → hook | Never extract |
| Thin shells | Component = layout + hook calls | God components |

### Naming [taste]

| Rule | ✓ Do | ✗ Don't |
|------|------|---------|
| Component files | `ChatInput.tsx` (PascalCase) | `chatInput.tsx` |
| Non-component files | `chatStore.ts` (camelCase) | `chat-store.ts`, `ChatStore.ts` |
| Event handlers | `submit`, `send`, `select` | `handleSubmit`, `handleSend` |
| Booleans | `disabled`, `open`, `loading` | `isDisabled`, `isOpen` |

### Documentation [taste]

| Rule | ✓ Do | ✗ Don't |
|------|------|---------|
| Exported functions | TSDoc `@param` / `@returns` | No docs on public API |
| Module-level | Nothing | `/** Client-side chat state... */` |
| Inline | Only *why* something is weird | Comments explaining obvious code |

### Error Handling [taste]

| Rule | ✓ Do | ✗ Don't |
|------|------|---------|
| Parse | Validate, throw on invalid | `?? []` fallback |
| Catch | Surface the error (throw/return Error) | Silent `catch { return [] }` |
| Guards | Trust logic above | Redundant `if (x) { ... }` after length check |

### CLI & Daemon [taste]

| Rule | ✓ Do | ✗ Don't |
|------|------|---------|
| Launch | `vybekiit local-dev` starts everything | Multiple commands to get running |
| Transport | WebSocket `ws://localhost:3006` | HTTP polling / SSE |
| Protocol | JSON messages, typed both directions | Untyped strings |
| Location | `daemon/` inside this app | Separate package |

## Never

These patterns are banned. Each is a real offender from the v0.1 codebase.

| Tell | Example | Enforced |
|------|---------|----------|
| Module-level JSDoc filler | `/** Preset workflows the agent can run... */` | [taste] |
| Comments restating code | `// Scroll to bottom when messages change.` | [taste] |
| Redundant guards | `if (first) { set(first) }` after `length > 0` | [taste] |
| `handle` prefix | `handleSend`, `handleNew`, `handleSelect` | [taste] |
| Silent catch | `catch { return [] }` | [taste] |
| `??` hiding bad state | `JSON.parse(raw) ?? []` | [taste] |
| Scattered storage keys | `const KEY = 'vybekiit-...'` in 4 files | [taste] |
| Template literal classes | `` `flex ${dynamic}` `` | [lint: cn()] |
| Separate import lines | Two `import` from same package | [lint: biome] |
| Function declarations | `export function X()` for components | [taste] |

## Exemplars

No golden exemplar files exist yet (v0.1 is pre-style). After the rewrite:
- `src/components/ChatInput.tsx` — leaf component pattern
- `src/stores/chatStore.ts` — Zustand store pattern
- `src/hooks/useChatSession.ts` — logic extraction hook pattern

## Formatter

Biome 2.5 (root `biome.json`). No per-app override needed.

```
indent: 2 spaces
lineWidth: 100
quotes: single
semicolons: always
trailingCommas: all
organizeImports: on
useSortedClasses: warn
useExportsLast: off
```
