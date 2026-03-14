# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- CSS design token system (`css/tokens.css`) with 3-tier architecture: primitive tokens (Tier 1), semantic tokens (Tier 2), and dark mode overrides (Tier 3).
- Security pipeline workflow (`.github/workflows/security.yml`) with lint, npm audit, gitleaks, CodeQL SAST, dependency review, license compliance, and SBOM generation.
- Dedicated CodeQL analysis workflow (`.github/workflows/codeql.yml`) with `security-extended` and `security-and-quality` query suites.
- SRI (Subresource Integrity) hashes on all CDN-loaded scripts: jsPDF, jsPDF-AutoTable, Alpine.js, and Alpine.js Collapse plugin.
- Content Security Policy (CSP) meta tag restricting script, style, image, connect, and font sources.
- Skip-to-content link for keyboard navigation accessibility.
- ARIA labels on interactive elements including theme toggle, search input, and sidebar navigation.
- ARIA landmarks (`role="navigation"`, `role="main"`, `role="search"`) for assistive technology.
- `aria-live` regions for dynamic content updates in search results and news feed areas.
- Search input accessibility improvements with proper labeling and keyboard support.
- Minimum 44px tap targets on interactive elements for touch accessibility.
- Standards documentation (`standards.md`) defining project conventions.
- Skill guides for common development tasks.
- Documentation suite: SECURITY.md, CONTRIBUTING.md, DEPLOYMENT.md, WHITE_LABEL_GUIDE.md, CHANGELOG.md.

### Changed
- Refactored `css/style.css` to use CSS custom property tokens exclusively -- zero hardcoded color values remain.
- Theme toggle updated with proper ARIA attributes (`aria-label`, `aria-pressed`) for screen reader support.
- Sidebar updated with `role="navigation"` landmark for assistive technology.

### Security
- Added CodeQL SAST scanning on push, PR, and weekly schedule.
- Added gitleaks secrets scanning across full git history.
- Added `npm audit --audit-level=high` in both the collection pipeline and the security pipeline.
- Added dependency review action on pull requests, blocking high-severity vulnerabilities and GPL/AGPL licensed dependencies.
- Added license compliance checking via `license-checker`, failing on GPL-3.0, AGPL, SSPL, and EUPL licenses.
- Added CycloneDX SBOM generation with 90-day artifact retention.
- Added pre-deploy secrets pattern scan in the Pages deployment workflow.
- Configured Dependabot for weekly updates of npm packages and GitHub Actions.
