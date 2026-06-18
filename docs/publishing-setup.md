# Publishing setup walkthrough

A one-time, do-it-in-order checklist to turn on npm publishing for the
`@syntropic137/*` packages. After this, every release is automatic and token-free
(see [distribution.md](./distribution.md) for the design and
[ADR-0009](./adrs/ADR-0009-release-pipeline.md) for the rationale).

**What you are setting up:** npm **trusted publishing (OIDC)**. Instead of storing a
long-lived `NPM_TOKEN`, npm trusts this repo's release workflow directly; at publish
time GitHub hands the workflow a short-lived identity token that npm verifies. Nothing
long-lived to leak, and every package gets a signed provenance attestation.

**The 6 packages this publishes:**

- `@syntropic137/contracts`
- `@syntropic137/design-tokens`
- `@syntropic137/default-react-v18`
- `@syntropic137/default-svelte-v5`
- `@syntropic137/brutalist-react-v18`
- `@syntropic137/brutalist-svelte-v5`

---

## Prerequisites

- [ ] The `syntropic137` npm org exists and your npm account is a member with publish
      rights. (You confirmed the org exists.)
- [ ] `npm` and `git` installed locally; `gh` (GitHub CLI) optional but handy.
- [ ] This branch is merged (or you are on a checkout that has the release pipeline:
      `.github/workflows/release.yml`, `scripts/publish-packages.mjs`).

---

## Step 1 - First-publish bootstrap (one time)

npm attaches a trusted publisher to a package that **already exists**, but these 6
packages are not on npm yet. So the very first publish is done by you, locally, to
create them. Every release after this is automatic.

```bash
# from the repo root
npm login                 # log in to the npm account that owns the syntropic137 org
pnpm install
pnpm build                # produce dist/ for every package

# sanity check first: packs all 6, publishes nothing
DRY_RUN=1 node scripts/publish-packages.mjs

# then the real first publish (creates all 6 packages on npm)
node scripts/publish-packages.mjs
```

- [ ] `npm login` succeeded.
- [ ] Dry run listed all 6 packages.
- [ ] Real run published all 6 (check https://www.npmjs.com/org/syntropic137).

> If a publish reports the package name is taken by someone else, tell me and we will
> pick a different scope or name. The `@syntropic137` scope should be yours.

---

## Step 2 - Configure trusted publishing (per package)

Do this once for **each** of the 6 packages on npmjs.com. After this, no token is
ever needed.

For each package: open `https://www.npmjs.com/package/@syntropic137/<name>` ->
**Settings** -> **Trusted Publishers** -> **Add** -> **GitHub Actions**, and enter:

| Field | Value |
| --- | --- |
| Organization / owner | `syntropic137` |
| Repository | `cross-framework-ui-design-system` |
| Workflow filename | `release.yml` |
| Environment | leave blank |

- [ ] contracts
- [ ] design-tokens
- [ ] default-react-v18
- [ ] default-svelte-v5
- [ ] brutalist-react-v18
- [ ] brutalist-svelte-v5

---

## Step 3 - Protect the `release` branch

This makes the `main -> release` PR a real gate: nothing reaches `release` (and
therefore nothing publishes) without a green CI run and a review.

> **Order matters:** do Step 1 (bootstrap) *before* this. The push that creates the
> `release` branch triggers `release.yml`, which runs the publish job. That is safe
> only because the publish step is idempotent (it skips versions already on npm) and
> the tag guard skips an existing tag, so a release-branch push when nothing has
> changed is a no-op. Creating `release` before the bootstrap would attempt a real
> first publish from CI instead of your controlled local bootstrap.

Using the GitHub CLI:

```bash
# create the release branch off main (only after Step 1 bootstrap)
git checkout main && git pull
git checkout -b release && git push -u origin release
git checkout main

# require the CI check + 1 review on release
gh api -X PUT repos/syntropic137/cross-framework-ui-design-system/branches/release/protection \
  -H "Accept: application/vnd.github+json" \
  -f "required_status_checks[strict]=true" \
  -f "required_status_checks[contexts][]=check" \
  -F "enforce_admins=false" \
  -F "required_pull_request_reviews[required_approving_review_count]=1" \
  -F "restrictions=null"
```

Or in the UI: **Settings -> Branches -> Add branch ruleset** for `release` -> require
a pull request + require status checks (`check`, the job in `ci.yml`).

- [ ] `release` branch exists.
- [ ] Branch protection requires CI + 1 review.

> The status check is named `check` (the job id in `.github/workflows/ci.yml`). If you
> rename that job, update the protection rule.

---

## Step 4 - Verify the automated release

From now on a release is: bump on `main`, PR into `release`, merge.

```bash
git checkout main && git pull
pnpm version:bump 0.2.0        # bumps all 6 packages + root, seeds a CHANGELOG entry
# edit the new CHANGELOG.md section to describe the release
git add -A && git commit -m "chore(release): 0.2.0"
git push

# open the release PR (CI gate runs on it)
gh pr create --base release --head main --title "Release 0.2.0" --body "See CHANGELOG.md"
```

When that PR is green and approved, **merge it**. On merge,
`.github/workflows/release.yml` runs the full gate again, publishes the 6 packages to
npm with provenance via OIDC, tags `v0.2.0`, and creates a GitHub Release.

- [ ] Release PR went green and was merged.
- [ ] The Release workflow published the packages (check the Actions tab and npm).
- [ ] `v0.2.0` tag and GitHub Release exist.

---

## How it runs day to day

```
feature branch ──PR──> main ──(bump + PR)──> release ──merge──> npm publish (OIDC)
                  │                    │                              │
               CI gate            CI gate = the                tag vX.Y.Z +
            (every PR)            release gate                 GitHub Release
```

- Versions move in **lockstep** (one number for all 6); `pnpm version:bump` enforces it.
- No tokens anywhere after Step 2.
- Re-pushing `release` without a version change is a no-op (the workflow skips a tag
  that already exists).

---

## Troubleshooting

- **Publish step fails with an auth/OIDC error:** the trusted publisher for that
  package is missing or its repo/workflow values do not match Step 2 exactly.
- **`npm publish` says workspace:^ is invalid:** you ran `npm publish` directly instead
  of `node scripts/publish-packages.mjs`; the script packs with `pnpm pack` first to
  rewrite workspace deps.
- **CI status check never satisfies branch protection:** the context name must match
  the `ci.yml` job id (`check`).
- **Pre-commit hook blocks a commit with `DI_BINARY_STALE`:** run `apss install` to
  rebuild the APSS composed binary.
