# ADR-0009: Release pipeline (release branch + gate + publish-on-merge)

- Status: Accepted
- Date: 2026-06-17
- Related: ADR-0008 (npm distribution), `rcl-tws.2`, `docs/distribution.md`

## Context

The packages are ready to publish to npm under the `@syntropic137/*` scope
(ADR-0008). We need a release process that is hard to trigger by accident, runs the
full quality gate before anything reaches the registry, and publishes
deterministically. Publishing is outward-facing and irreversible (a version cannot
be unpublished cleanly), so the trigger must be deliberate and the gate must be
mandatory.

## Decision

A **release-branch model with publish-on-merge**:

- **Branches.** `main` is the integration line; every PR to it runs `pnpm qa` via
  `ci.yml`. `release` is the production line; it is updated only by a reviewed PR
  from `main`.
- **The release gate is the `main` -> `release` PR.** `ci.yml` runs the full gate on
  that PR (lint, typecheck, build, test, `design-system:verify`, `test:verify`,
  Storybook tests). The version bump and CHANGELOG entry land in this PR. Branch
  protection on `release` requires the gate green plus review, so nothing reaches
  `release` un-gated.
- **Publish happens on merge.** `.github/workflows/release.yml` triggers on push to
  `release`: it re-runs `pnpm qa` (belt-and-suspenders on the merged result), then
  `pnpm publish:packages` publishes the public packages with **provenance**, tags
  `vX.Y.Z`, and creates a GitHub Release. A guard skips publish if the tag already
  exists, so re-pushing `release` is idempotent. The publish step packs each package
  with `pnpm pack` (rewriting `workspace:^` to real versions) and runs `npm publish`,
  which performs the npm **OIDC trusted-publishing** handshake (no `NPM_TOKEN`): plain
  `npm publish` cannot rewrite workspace deps and pnpm 9 cannot do the OIDC exchange,
  so each tool does the part it does well.
- **Versioning is lockstep** (ADR-0008). `pnpm version:bump <semver>`
  (`scripts/bump-version.mjs`, zero dependencies) sets the version on every package
  with `"private": false` plus the root, and seeds a CHANGELOG entry. The publish
  job derives the tag from the version in the published packages.
- **What publishes** is decided by the `private` flag, not the workflow: the 6
  publishable packages are `"private": false` with
  `"publishConfig": { "access": "public", "provenance": true }`; the apps, dashboard,
  and generator are `"private": true`, which the publish script skips.

## Consequences

- **Positive:** a publish requires a reviewed PR into a protected branch that passed
  the full gate, then a merge. The blast radius of an accidental publish is small,
  and every release is reproducible from the tagged commit with provenance.
- **Positive:** lockstep + the zero-dep bump script keep versioning simple and free
  of new tooling, matching the repo's zero-dependency ethos.
- **Cost / manual prerequisites (not codeable here):** npm **trusted publishing
  (OIDC)** must be configured per package on npmjs.com (pointing at this repo +
  workflow; no token stored), and branch protection on `release` must require
  `ci.yml` + review. Because a trusted publisher attaches to an existing package, the
  first publish of each new package needs a one-time bootstrap (publish once with
  `npm login`). Until these exist the workflow runs but the publish step fails on
  auth. All tracked in `docs/distribution.md`.
- **Cost:** re-running `pnpm qa` in the publish job duplicates the PR's gate and adds
  minutes; accepted because publishing is irreversible.
