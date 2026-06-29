# Platform wrapper: ship via PR (agent-only)

**Agent-only.** Save work through a safe branch + online checker — use when changes are large or the builder is waiting.

## When

- After meaningful progress and `back-up-my-code` already created a remote
- Builder is impatient — use a **git worktree** so main stays runnable while you work in parallel
- Before merging to `main`, CI must be green on all three OS jobs (`ci-vybekiit.md`)

## Flow

1. **Worktree (optional, parallel work):**
   ```bash
   git worktree add ../my-app-feature feature/save-progress
   cd ../my-app-feature
   ```

2. **Branch + commit:**
   ```bash
   git checkout -b feature/save-progress
   git add -A
   git commit -m "Save progress"
   ```

3. **Push + open PR:**
   ```bash
   git push -u origin HEAD
   gh pr create --title "Save progress" --body "Agent checkpoint — checks running."
   ```

4. **Wait for CI** — all ubuntu/macOS/Windows jobs green (`gh pr checks --watch`).

5. **Merge when green:**
   ```bash
   gh pr merge --squash --delete-branch
   ```

6. Tell the builder in plain words: *"Your latest work is saved and checked."*

## Rules

- Never expose PR, worktree, or branch jargon — see `language.md`.
- Pre-push hook runs before push; fix locally first.
- Never merge red CI — fix and push again.

## Verify

PR merged · `main` green on GitHub · builder hears one plain success line
