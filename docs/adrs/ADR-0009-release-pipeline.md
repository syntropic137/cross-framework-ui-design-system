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
  `pnpm publish:packages` publishes the public packages to npm with **provenance**
  (OIDC `id-token`), tags `vX.Y.Z`, and creates a GitHub Release. A guard skips
  publish if the tag already exists, so re-pushing `release` is idempotent.
- **Versioning is lockstep** (ADR-0008). `pnpm version:bump <semver>`
  (`scripts/bump-version.mjs`, zero dependencies) sets the version on every package
  with `"private": false` plus the root, and seeds a CHANGELOG entry. The publish
  job derives the tag from the version in the published packages.
- **What publishes** is decided by the `private` flag, not the workflow: the 6
  publishable packages are `"private": false` with
  `"publishConfig": { "access": "public", "provenance": true }`; the apps, dashboard,
  and generator are `"private": true` and `pnpm -r publish` skips them.

## Consequences

- **Positive:** a publish requires a reviewed PR into a protected branch that passed
  the full gate, then a merge. The blast radius of an accidental publish is small,
  and every release is reproducible from the tagged commit with provenance.
- **Positive:** lockstep + the zero-dep bump script keep versioning simple and free
  of new tooling, matching the repo's zero-dependency ethos.
- **Cost / manual prerequisites (not codeable here):** the npm org `syntropic137`
  must exist; an `NPM_TOKEN` automation token must be added as a repo secret (or npm
  trusted-publisher OIDC configured); and branch protection on `release` must require
  `ci.yml` + review. Until those exist, the workflow will run but the publish step
  fails on auth. These are tracked in `docs/distribution.md`.
- **Cost:** re-running `pnpm qa` in the publish job duplicates the PR's gate and adds
  minutes; accepted because publishing is irreversible.
