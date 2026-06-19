# ADR-0005: Design-system enforcement gate

- Status: Accepted
- Date: 2026-06-16
- Related: ADR-0002 (token generation), ADR-0004 (matrix), ADR-0007 (contract model)

## Context

The design system makes promises that span packages: components must use design
tokens (not hardcoded colors), every design×framework cell must implement the
framework-neutral contract, and every cell must export a stable adapter. Nothing
inside a single package can verify these cross-cutting invariants, and "we'll
review it in PR" does not scale — a regression in one cell silently breaks the
swap guarantee that is the whole point of the system.

We want the invariants *enforced by a gate*, not merely documented, and we want a
test that proves the gate actually catches violations (a gate nobody trusts is a
gate nobody keeps green).

## Decision

Add a single verification script, `scripts/verify-design-system.mjs`
(`pnpm design-system:verify`), with **zero dependencies** (Node built-ins only),
that runs four checks and exits non-zero on any failure:

- **CHECK A — tokens present.** The generated tokens CSS exists and defines the
  expected `--ds-*` custom properties.
- **CHECK B — token discipline.** Design/component CSS uses `var(--ds-color-*)`
  only; no hardcoded hex/rgb/hsl **or named** colors. Decorative files (e.g.
  confetti) are explicitly allowlisted. Violations report `file:line` + snippet.
- **CHECK C — contract conformance.** Typecheck proves each cell's adapter
  satisfies the required contract surface.
- **CHECK D — adapter presence.** Each cell exports its framework's stable adapter
  name (`reactV18ContractAdapter` / `svelteV5ContractAdapter`).

Prove the gate with `scripts/verify-design-system.test.mjs`
(`pnpm test:verify`, run via `node --test`): it asserts the checker flags known
violations *and* passes known-good input. Both `design-system:verify` and
`test:verify` are wired into `pnpm qa` (and therefore CI).

The script is structured as importable functions (`scanCssForHardcodedColors`,
`isDecorativeFile`, …) with the CLI guarded by an
`import.meta.url === file://…argv[1]` check, so the test imports the same code the
CLI runs.

## Consequences

- **Positive:** the swap/token/contract guarantees are mechanically enforced; a
  half-wired cell or a stray `#fff` fails CI, not a human reviewer. The
  prove-the-gate test stops the gate from rotting into a no-op.
- **Positive:** zero dependencies keeps the gate itself inside the
  supply-chain-hardening posture (ADR-0008) and makes it trivially portable.
- **Cost:** new check categories must be added deliberately as the system grows
  (e.g. `rem`-sizing discipline, a11y assertions); the gate is only as good as its
  checks. `rcl-tws.11` tracks making the verify pass strictly read-only/no-emit.
- The gate is the runtime complement to ADR-0007's compile-time contract: CHECK C
  is the type system, CHECK B/D are the things the type system can't see.
