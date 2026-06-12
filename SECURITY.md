# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it
privately rather than opening a public issue.

- Use [GitHub private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)
  (Security tab → Report a vulnerability), or
- Email the maintainer.

Please include:

- A description of the vulnerability and its impact
- Steps to reproduce or a proof of concept
- Any suggested remediation

We aim to acknowledge reports within 5 business days.

## Supported Versions

This is a pre-1.0 project; only the latest `main` is supported with security
fixes.

## Security Controls

This repository enforces several supply-chain and code-security controls in CI:

- **GitHub Actions pinned to immutable commit SHAs** — prevents tag-repointing
  attacks (see the comments in `.github/workflows/ci.yml`).
- **Least-privilege workflow permissions** — `contents: read` by default.
- **Frozen lock file installs** (`pnpm install --frozen-lockfile`) — reproducible
  builds; the committed `pnpm-lock.yaml` is the source of truth.
- **All install scripts blocked** (`.npmrc` `ignore-scripts=true`) — no
  dependency's preinstall/install/postinstall can execute, the strongest defense
  against postinstall-hook supply-chain attacks.
- **OSV Scanner** (blocking) — dependency vulnerability scanning on every push
  and PR. Acknowledged, non-applicable advisories are documented with reasons
  and a review date in `osv-scanner.toml`; the scan still fails on anything else.
- **Dependency Review** — blocks PRs that introduce high-severity vulnerabilities.
- **Dependabot security updates** — opens PRs only for actual CVEs (version-bump
  PRs are disabled to avoid noise).

## Dependency Security Status

_Last reviewed: 2026-06-12._

- **Production dependencies: clean.** `pnpm audit --prod` reports zero known
  vulnerabilities. Nothing vulnerable ships in the published packages.
- A major-upgrade pass (PR #26) moved the toolchain to ESLint 9 (flat config),
  Storybook 10, vite 6, and vitest 4, reducing unique vulnerable packages from
  19 to 3 and eliminating all critical advisories.
- The **3 remaining advisories are dev-only** transitive dependencies of
  `@storybook/test-runner` (`axios`, `joi`, `uuid`) — used to run Storybook
  stories as browser tests in CI, never imported by the library or run at
  runtime. They cannot currently be removed: the modern replacement
  (`@storybook/addon-vitest`) is unstable under pnpm strict isolation with
  vitest 4, and the only reliable workaround would weaken supply-chain
  isolation. These are acknowledged in `osv-scanner.toml`.
- One additional acknowledged item, `GHSA-gv7w-rqvm-qjhr` (esbuild Deno-loader
  RCE), **does not apply** — esbuild is used via vite/Node at build time, never
  through the Deno loader.
- **Open follow-up (review by 2026-09-01):** retry the
  `@storybook/test-runner` → `@storybook/addon-vitest` migration to clear the
  last 3, and re-evaluate the `osv-scanner.toml` acknowledgements.
