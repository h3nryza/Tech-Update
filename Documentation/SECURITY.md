# Security Model

This document describes the security posture of Tech Update, a static tech news aggregator built with Alpine.js, Tailwind CSS, and GitHub Pages.

---

## Architecture Security

Tech Update is a **static site** with no server-side code, no backend API, no authentication system, and no database. This architecture eliminates entire classes of vulnerabilities by design:

- **No backend** -- No server-side injection (SQL, command, LDAP), no session management flaws, no server misconfiguration.
- **No authentication** -- No credential storage, no password reset flows, no session tokens to steal.
- **No PII collection** -- The site does not collect, store, or process any personally identifiable information. There are no forms, no user accounts, and no analytics cookies.
- **No user-generated content** -- All content is sourced from RSS feeds and committed to the repository via automated pipelines.

The attack surface is limited to the static files served by GitHub Pages and the CI/CD pipeline that produces them.

---

## CDN Dependency Risk Mitigations

The site loads four external scripts from CDNs (Tailwind CSS, Alpine.js, jsPDF, jsPDF-AutoTable). Two controls are in place to mitigate supply-chain risk:

### Subresource Integrity (SRI) Hashes

All CDN-loaded scripts include `integrity` attributes with SHA-384 hashes. If a CDN is compromised and serves modified JavaScript, the browser will refuse to execute the script.

Covered scripts:
- `jspdf.umd.min.js` (cdnjs.cloudflare.com)
- `jspdf.plugin.autotable.min.js` (cdnjs.cloudflare.com)
- `@alpinejs/collapse` (cdn.jsdelivr.net)
- `alpinejs` (cdn.jsdelivr.net)

### Content Security Policy (CSP)

A `<meta http-equiv="Content-Security-Policy">` tag restricts resource loading:

| Directive     | Allowed Origins                                                            |
|---------------|---------------------------------------------------------------------------|
| `default-src` | `'self'`                                                                  |
| `script-src`  | `'self'`, `cdn.tailwindcss.com`, `cdn.jsdelivr.net`, `cdnjs.cloudflare.com`, `'unsafe-eval'` |
| `style-src`   | `'self'`, `'unsafe-inline'`, `cdn.tailwindcss.com`                        |
| `img-src`     | `'self'`, `data:`                                                         |
| `connect-src` | `'self'`                                                                  |
| `font-src`    | `'self'`                                                                  |

Note: `unsafe-eval` is required by Tailwind CSS's JIT compiler running in the browser. This is acceptable because no user input reaches `eval()`.

---

## RSS Feed Injection Prevention

RSS feeds are the primary external data input. Two layers prevent injection:

1. **Server-side sanitization** -- The `collect.js` Node.js script processes feed data before writing it to `data/news.json`. Content is stored as plain text fields (title, URL, date, source name).

2. **Client-side auto-escaping** -- Alpine.js `x-text` directives are used to render feed content in the browser. `x-text` automatically escapes HTML entities, preventing any stored XSS from rendering. The project does not use `x-html` for user-facing content.

---

## Data Integrity

All data files (`data/news.json`, `data/sources.json`, `data/config.json`) are:

- **Git-tracked** -- Every change is recorded in version history with full audit trail.
- **Pipeline-validated** -- The collection workflow validates data integrity before committing:
  - Every news item must have `id`, `title`, and `url` fields.
  - Source and item counts are logged.
  - Validation failure causes the pipeline to exit without committing.
- **Committed by a bot account** -- Automated data updates are committed by `github-actions[bot]`, making it easy to distinguish automated changes from human changes.

---

## CI/CD Security Pipeline

### security.yml

Runs on every push to `main`, every PR targeting `main`, and weekly on Sunday at 04:00 UTC.

| Job                | Tool                            | Purpose                                               |
|--------------------|---------------------------------|-------------------------------------------------------|
| Lint & Audit       | `npm audit --audit-level=high`  | Fail on high/critical dependency vulnerabilities      |
| Lint & Audit       | ESLint security rules           | Detect `eval()`, `new Function()`, implied eval       |
| Secrets Scan       | gitleaks                        | Scan full git history for leaked secrets              |
| CodeQL SAST        | github/codeql-action            | Static analysis with `security-and-quality` queries   |
| Dependency Review  | actions/dependency-review-action| Block PRs introducing high-severity or GPL/AGPL deps  |
| License Compliance | license-checker                 | Fail on GPL-3.0, AGPL, SSPL, EUPL licenses           |
| SBOM Generation    | @cyclonedx/cyclonedx-npm        | Produce CycloneDX SBOM artifact (90-day retention)    |

### codeql.yml

Dedicated CodeQL workflow with `security-extended` and `security-and-quality` query suites. Runs on push, PR, and weekly (Sunday 05:00 UTC, offset from security.yml).

### pages.yml (Deploy)

The deployment workflow includes a pre-deploy secrets scan that checks committed files for common secret patterns (AWS keys, OpenAI keys, GitHub PATs, hardcoded passwords).

### collect.yml (Daily Pipeline)

Runs `npm audit --audit-level=high` before collecting data, catching dependency vulnerabilities in the collection scripts.

---

## Dependabot Configuration

Dependabot is configured (`.github/dependabot.yml`) with two ecosystems:

| Ecosystem        | Directory   | Schedule | PR Limit | Labels                  |
|------------------|-------------|----------|----------|-------------------------|
| npm              | `/scripts`  | Weekly   | 10       | `dependencies`          |
| github-actions   | `/`         | Weekly   | 5        | `dependencies`, `ci`    |

This ensures both Node.js packages and GitHub Actions are kept up to date with automated PRs.

---

## Branch Protection Rules

The `main` branch should be configured with the following protections:

- Require pull request reviews before merging (at least 1 approval).
- Require status checks to pass before merging (security pipeline, CodeQL).
- Require branches to be up to date before merging.
- Do not allow force pushes.
- Do not allow deletions.

---

## Vulnerability Reporting

If you discover a security vulnerability in this project:

1. **Do not open a public issue.** Security issues should not be disclosed publicly before a fix is available.
2. Open a **private security advisory** via the repository's Security tab on GitHub (Settings > Security > Advisories > New draft security advisory).
3. Alternatively, contact the maintainer directly via the email listed in the repository profile.
4. Include:
   - Description of the vulnerability.
   - Steps to reproduce.
   - Potential impact.
   - Suggested fix (if any).

The maintainer will acknowledge receipt within 48 hours and aim to provide a fix or mitigation within 7 days.

---

## Compliance Summary

### WCAG 2.1 AA (Partial)

The following accessibility measures are implemented:

- Skip-to-content link for keyboard navigation.
- ARIA landmarks (`role="navigation"`, `role="main"`, `role="search"`).
- ARIA labels on interactive elements (theme toggle, search input, sidebar).
- `aria-live` regions for dynamic content updates (search results, news feed).
- Minimum 44px tap targets for touch accessibility.
- Keyboard-accessible search input with proper labeling.
- Dark mode respects `prefers-color-scheme` system preference.

Status: **Partial compliance.** A full WCAG audit has not been conducted. Known gaps may exist in color contrast ratios under certain theme configurations and in complex interactive components.

### OWASP Top 10

| Category                                | Status | Notes                                                    |
|-----------------------------------------|--------|----------------------------------------------------------|
| A01: Broken Access Control              | N/A    | No access control (public static site)                   |
| A02: Cryptographic Failures             | Pass   | No sensitive data stored or transmitted                  |
| A03: Injection                          | Pass   | No server-side processing; client uses `x-text` escaping |
| A04: Insecure Design                    | Pass   | Static architecture minimizes attack surface             |
| A05: Security Misconfiguration          | Pass   | CSP headers, SRI hashes, minimal permissions in CI       |
| A06: Vulnerable/Outdated Components     | Pass   | Dependabot + npm audit + dependency review on PRs        |
| A07: Identification/Authentication      | N/A    | No authentication system                                 |
| A08: Software/Data Integrity Failures   | Pass   | SRI on CDN scripts, git-tracked data, pipeline validation|
| A09: Security Logging/Monitoring        | Pass   | GitHub Actions logs, git history as audit trail          |
| A10: Server-Side Request Forgery (SSRF) | N/A    | No server-side HTTP requests in production               |
