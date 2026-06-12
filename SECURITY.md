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
- **Install-script allowlist** (`pnpm.onlyBuiltDependencies`) — only vetted native
  packages may run install scripts.
- **OSV Scanner** — dependency vulnerability scanning on every push and PR.
- **Dependency Review** — blocks PRs that introduce high-severity vulnerabilities.
- **CodeQL** — static analysis (SAST) for JavaScript/TypeScript.
- **Dependabot** — automated updates for Actions and npm dependencies.
