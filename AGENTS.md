<!--
  Canonical agent-instructions source of truth (agents.md format — https://agents.md).
  CLAUDE.md is a SYMLINK to this file: Claude Code reads CLAUDE.md, not AGENTS.md,
  so the symlink keeps both identical with zero drift. Edit this file only.
  Windows: symlinks need Developer Mode/Admin. If a clone is missing CLAUDE.md,
  recreate it with `ln -s AGENTS.md CLAUDE.md`, or make CLAUDE.md a one-line
  `@AGENTS.md` import instead.
-->

# React Component Library & Design System

A cross-framework component library and design system built as a **pnpm monorepo** (`pnpm@9.1.4`). Design tokens generate layered CSS that per-framework packages (React 18, Svelte 5) consume; component contracts are verified in Storybook. The goal is a type-safe adapter so an app can swap component libraries (React ↔ Svelte) without changing app code.

## Setup

```bash
pnpm install
```

## Build / test / lint

```bash
pnpm qa            # lint + typecheck + build + test + storybook:test — the full gate
pnpm lint          # eslint across all packages
pnpm typecheck     # tsc across all packages
pnpm test          # vitest across all packages
pnpm build         # build design tokens, then all packages
pnpm format        # prettier across all packages
pnpm storybook     # React Storybook locally (pnpm storybook:svelte for Svelte)
pnpm generate:component   # scaffold a new component via the generator CLI
```

**Run `pnpm qa` and fix all failures before finishing a task.**

## Project layout

- `packages/design-tokens/` (`@syntropic137/design-tokens`) — token definitions → layered CSS + JSON snapshots
- `designs/default/react-v18/` (`@syntropic137/default-react-v18`) — React 18 library (Vite build, Storybook)
- `designs/default/svelte-v5/` (`@syntropic137/default-svelte-v5`) — Svelte 5 library
- `packages/dev-tools/component-generator/` (`@syntropic137/component-generator`) — component scaffolding CLI
- `docs/` — `docs/component-standard.md` (canonical component contract), ADRs in `docs/adrs/`

## Conventions

- **Test-first.** Write contract/unit tests before implementing a component; treat test code as seriously as production code.
- **Tokens, not hardcoded values.** Components use semantic design tokens; size in `rem`, not `px`.
- **Theming is decoupled from components.** Color and theme swaps (light/dark and beyond) happen through tokens, never per-component edits.
- **ADRs** for non-obvious architecture decisions, under `docs/adrs/`.
- **Conventional commits** — `type(scope): description` using `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`.
- Do **not** commit draft project plans (`PROJECT-PLAN_*.md`) or session handoffs (`docs/handoffs/`) — both are gitignored.

## Testing

- Unit/contract tests run on **Vitest + Testing Library**, co-located with components.
- Storybook interaction tests run via `pnpm storybook:test` (included in `pnpm qa`).
- Every component must satisfy the contract in `docs/component-standard.md`; components use semantic roles/ARIA and tests assert key attributes (automated axe-style a11y gating is not yet in place).

## Security

- Dependency advisories are gated with **osv-scanner** (`osv-scanner.toml`); never silence security scans with `continue-on-error`.
- No secrets in the repo. See `SECURITY.md` for the current posture and controls.

## Pull requests

- Branch off `main`; integrate via PR (the repo history is PR-based).
- `pnpm qa` must pass before merge.
- Keep commits conventional and scoped to one logical change.

<!-- br-agent-instructions-v1 -->

---

## Beads Workflow Integration

This project uses [beads_rust](https://github.com/Dicklesworthstone/beads_rust) (`br`/`bd`) for issue tracking. Issues are stored in `.beads/` and tracked in git.

### Essential Commands

```bash
# View ready issues (open, unblocked, not deferred)
br ready              # or: bd ready

# List and search
br list --status=open # All open issues
br show <id>          # Full issue details with dependencies
br search "keyword"   # Full-text search

# Create and update
br create --title="..." --description="..." --type=task --priority=2
br update <id> --status=in_progress
br close <id> --reason="Completed"
br close <id1> <id2>  # Close multiple issues at once

# Sync with git
br sync --flush-only  # Export DB to JSONL
br sync --status      # Check sync status
```

### Workflow Pattern

1. **Start**: Run `br ready` to find actionable work
2. **Claim**: Use `br update <id> --status=in_progress`
3. **Work**: Implement the task
4. **Complete**: Use `br close <id>`
5. **Sync**: Always run `br sync --flush-only` at session end

### Key Concepts

- **Dependencies**: Issues can block other issues. `br ready` shows only open, unblocked work.
- **Priority**: P0=critical, P1=high, P2=medium, P3=low, P4=backlog (use numbers 0-4, not words)
- **Types**: task, bug, feature, epic, chore, docs, question
- **Blocking**: `br dep add <issue> <depends-on>` to add dependencies

### Session Protocol

**Before ending any session, run this checklist:**

```bash
git status              # Check what changed
git add <files>         # Stage code changes
br sync --flush-only    # Export beads changes to JSONL
git commit -m "..."     # Commit everything
git push                # Push to remote
```

### Best Practices

- Check `br ready` at session start to find available work
- Update status as you work (in_progress → closed)
- Create new issues with `br create` when you discover tasks
- Use descriptive titles and set appropriate priority/type
- Always sync before ending session

<!-- end-br-agent-instructions -->
