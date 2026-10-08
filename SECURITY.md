# Security Policy

## Supported packages

Only two packages are published to npm:

- `@syntropic137/design-contracts`
- `@syntropic137/design-tokens`

Security fixes land on the latest released version. The `designs/*` packages are
`"private": true` reference implementations. They are never published: the
publish script (`scripts/publish-packages.mjs`) and the release gate
(`scripts/release-gate.mjs`) both refuse a release in which any package other
than the two above is publishable.

## Reporting a vulnerability

Do not open a public issue. Report privately through GitHub private
vulnerability reporting on this repository: **Security** tab -> **Advisories**
-> **Report a vulnerability**
(`https://github.com/syntropic137/cross-framework-ui-design-system/security/advisories/new`).

Include a description and impact, steps to reproduce or a proof of concept, and
any suggested fix. We aim to acknowledge reports within 5 business days.

## Release security model

As configured on 2026-10-08:

- **No npm tokens.** Publishing uses npm trusted publishing (OIDC) from GitHub
  Actions. npm trusts only workflow `release.yml` in this repository, running in
  the GitHub environment `npm-publish`. The job's short-lived OIDC id-token is
  exchanged for ephemeral publish credentials; nothing long-lived is stored.
- **Environment `npm-publish`** requires approval from the repository owner
  before the publish job runs, and may only be deployed from the `release`
  branch.
- **`release` branch ruleset:** changes only by pull request (by process, a PR
  from `main`), merge commits only; required checks `check`, `Release Gate` and
  `OSV Vulnerability Scan`; no force pushes, no deletions; no bypass actors.
- **`main` branch ruleset:** pull request required, with required checks `check`
  and `OSV Vulnerability Scan`; no force pushes, no deletions; no bypass actors.
- **Release gate** (`release-gate.yml`, on every PR into `release`) refuses
  mixed versions across the published packages, a `v<version>` tag that already
  exists locally or on origin, a version already on npm, and a missing
  `## <version>` heading in `CHANGELOG.md`. A registry or network error fails
  the gate; nothing is skipped.
- **Publish script** pins the public registry (`https://registry.npmjs.org/`,
  including the `@syntropic137` scope) for both the "already published" lookup
  and the publish, so npm config overrides cannot redirect either. It publishes
  with `--provenance` only in CI (GitHub Actions); the one-time local bootstrap
  publish had no OIDC context and carries no provenance.
- **Install hardening:** CI and the release job install with
  `--frozen-lockfile`, and `.npmrc` sets `ignore-scripts=true`, so no dependency
  lifecycle script runs. Workflow actions are pinned to commit SHAs with
  least-privilege `permissions`.

**What an attacker would need** to publish a malicious version: write access to
`main` to land the change, AND a green gate (`check`, `Release Gate`, OSV) on the
`main` -> `release` PR, AND the repository owner's approval on the `npm-publish`
environment. Every published version carries a provenance attestation recording
the exact repository, workflow, commit and run that built it, so a publish from
anywhere else is detectable with `npm audit signatures`.

## Dependency hygiene

- **Dependency Review** and **OSV Scanner** run on every pull request. OSV is
  blocking.
- **Dependabot security updates** are enabled for actual advisories.
- Prefer fixing at source via `pnpm.overrides` in `package.json`. Any ignore in
  `osv-scanner.toml` must be dated and justified. The only current ignore is
  `GHSA-vfj7-8cjw-p6xm` (`braces` <= 3.0.3, no fixed release exists; reached
  only through dev-only glob tooling), expiring **2027-01-08**.

## What is NOT covered

- The private `designs/*` reference implementations (copy them at your own
  risk; they are not published or supported as packages).
- The Storybook and other demo apps under `apps/`.
- Consumers' own build and release pipelines.
