# ADR-0008: npm distribution & zero-dependency policy

- Status: Accepted
- Date: 2026-06-16 (decision updated 2026-10-08)
- Related: ADR-0004 (matrix), ADR-0007 (contract model), `rcl-tws.2`, `rcl-tws.9`, `rcl-tws.10`

## Context

The system should be consumable by external apps via npm, not only inside this
workspace. We need to decide *what* publishes, *how* it's versioned, and how we
keep the supply-chain posture the user cares about — specifically a
**zero-dependency** guarantee for the two foundational packages
(`@syntropic137/design-contracts`, `@syntropic137/design-tokens`).

Current state is inconsistent and not publish-ready: `private` flags differ across
packages (contracts `false`, design-tokens `true`, default-react-v18 `true`,
default-svelte-v5 `false`), no package sets `publishConfig`, all are `0.1.0`, and
`@syntropic137/design-tokens` has **no `exports` map** despite being imported by
subpath (`/generated/design-tokens.css`) — which works in bundlers today but
breaks under strict `exports` resolution once published.

## Decision

**What publishes (public):**

- `@syntropic137/design-contracts` — framework-neutral API. **Zero runtime deps.**
- `@syntropic137/design-tokens` — tokens CSS/JSON. **Zero runtime deps.**
- ~~The design cells `@syntropic137/<design>-<framework>`.~~ Withdrawn
  2026-10-08: see the decision update below. The cells are private reference
  implementations.

**What stays private (`"private": true`, never published):** the apps
(`apps/tauri-harness*`), the dashboard TUI, and the component generator —
internal tooling, not products.

**Zero-dependency policy (enforced, not promised):** `contracts` and
`design-tokens` must have empty `dependencies`. Add a check (extend
`design-system:verify`, or a small `node --test`) that fails if either package's
`package.json` declares any runtime dependency. Tracked in `rcl-tws.9`. This is
why the verify gate itself (ADR-0005) is also zero-dep — the foundation must not
pull anything in.

**Versioning:** all design-system packages version **in lockstep** under one
semver line, matching the Standard version in `docs/component-standard.md`. A
contract change (the thing that ripples across every cell) is the unit of release,
so independent per-package versions would create false divergence. Workspace
`workspace:^` references are rewritten to the published version at pack time (pnpm
does this automatically on `pnpm publish`).

**Packaging hygiene (blockers before first publish):**

1. Add an `exports` map to `@syntropic137/design-tokens` exposing `.` and
   `./generated/design-tokens.css` (and the JSON), so subpath imports survive
   strict resolution.
2. Normalize `private`/`publishConfig`: every publishable package gets
   `"publishConfig": { "access": "public", "provenance": true }`; set `private`
   correctly per the lists above.
3. Ensure each package's `files` (or `.npmignore`) ships only built output +
   needed source, and that types resolve (the react cells' `.d.ts` emission fix
   from ADR-0004 must hold).
4. Publish from CI with npm **provenance** (`--provenance`, OIDC), keeping
   `ignore-scripts=true` and `--frozen-lockfile` (the existing supply-chain
   hardening).

**Release flow** (detailed in `rcl-tws.2` / `docs/distribution.md`): bump the
shared version → changeset/CHANGELOG → tag → CI builds, runs `pnpm qa`, publishes
with provenance.

## Decision update 2026-10-08

**Only the foundations publish.** `@syntropic137/design-contracts` and
`@syntropic137/design-tokens` are the published packages. The four component
implementations under `designs/` (`@syntropic137/default-react-v18`,
`default-svelte-v5`, `brutalist-react-v18`, `brutalist-svelte-v5`) are
`"private": true`, carry no `publishConfig`, and must never publish automatically.
They keep their names and the lockstep version (`pnpm version:bump` still bumps
them) so the repo stays on one line.

**Rationale.** The product is the contract and the tokens, not one component set.
Any component library, in any framework, implements the design contracts and
consumes the tokens. That gives build-time type checking of compatibility, and
lets themes and component sets be swapped under any UI that depends on the
contracts. Styling is vanilla CSS from the tokens, with no framework-specific
styling layer. The `designs/` cells prove the contracts are implementable and
serve as examples to copy; publishing them would make one implementation look
canonical and widen the supported surface for no gain.

**Enforcement.** `EXPECTED_PACKAGES` in `scripts/lib/publishable-packages.mjs`
is exactly the two foundations; `checkPackageSet` (used by `publish:packages`
and `release:gate`) fails, naming the package, if any `designs/` package
becomes publishable again.

## Consequences

- **Positive:** external apps get a clean, minimal dependency footprint; the two
  foundational packages are auditable to zero deps and the policy is enforced, not
  aspirational.
- **Positive:** lockstep versioning makes "which versions are compatible" trivial
  — they're equal.
- **Cost:** lockstep means a cell-only change still bumps everyone (the cells no
  longer publish, so this only moves the repo's version line); acceptable while
  the matrix is small. Revisit if cells diverge in cadence.
- **Open:** the `@syntropic137` npm scope must be secured (org or rename); the
  repo-rename beads (`rcl-95y`/`rcl-0fp`) intersect with the published name.
  Practical checklist and the `exports`/`publishConfig` edits live in
  [`docs/distribution.md`](../distribution.md) and `rcl-tws.10`.
