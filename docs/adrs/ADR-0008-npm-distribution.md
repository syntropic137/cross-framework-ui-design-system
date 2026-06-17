# ADR-0008: npm distribution & zero-dependency policy

- Status: Accepted
- Date: 2026-06-16
- Related: ADR-0004 (matrix), ADR-0007 (contract model), `rcl-tws.2`, `rcl-tws.9`, `rcl-tws.10`

## Context

The system should be consumable by external apps via npm, not only inside this
workspace. We need to decide *what* publishes, *how* it's versioned, and how we
keep the supply-chain posture the user cares about — specifically a
**zero-dependency** guarantee for the two foundational packages
(`@syntropic137/contracts`, `@syntropic137/design-tokens`).

Current state is inconsistent and not publish-ready: `private` flags differ across
packages (contracts `false`, design-tokens `true`, default-react-v18 `true`,
default-svelte-v5 `false`), no package sets `publishConfig`, all are `0.1.0`, and
`@syntropic137/design-tokens` has **no `exports` map** despite being imported by
subpath (`/generated/design-tokens.css`) — which works in bundlers today but
breaks under strict `exports` resolution once published.

## Decision

**What publishes (public):**

- `@syntropic137/contracts` — framework-neutral API. **Zero runtime deps.**
- `@syntropic137/design-tokens` — tokens CSS/JSON. **Zero runtime deps.**
- The design cells `@syntropic137/<design>-<framework>` — framework as a
  `peerDependency` (react/react-dom, or svelte), tokens/contracts as peer or
  regular deps. React cells may carry `clsx` only.

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

## Consequences

- **Positive:** external apps get a clean, minimal dependency footprint; the two
  foundational packages are auditable to zero deps and the policy is enforced, not
  aspirational.
- **Positive:** lockstep versioning makes "which versions are compatible" trivial
  — they're equal.
- **Cost:** lockstep means a cell-only patch still bumps everyone; acceptable while
  the matrix is small. Revisit if cells diverge in cadence.
- **Open:** the `@syntropic137` npm scope must be secured (org or rename); the
  repo-rename beads (`rcl-95y`/`rcl-0fp`) intersect with the published name.
  Practical checklist and the `exports`/`publishConfig` edits live in
  [`docs/distribution.md`](../distribution.md) and `rcl-tws.10`.
