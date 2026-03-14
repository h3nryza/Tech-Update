# Security Pipeline Guide

Reference for setting up security pipelines in GitHub Actions.

---

## Workflow Template

```yaml
name: Security Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 6 * * 1' # Weekly Monday 06:00 UTC

permissions:
  contents: read
  security-events: write
  pull-requests: read

jobs:
  # ──────────────────────────────────────────────
  # Stage 1: Lint
  # ──────────────────────────────────────────────
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run ESLint
        run: npx eslint . --format @microsoft/eslint-formatter-sarif --output-file eslint.sarif
        continue-on-error: true

      - name: Upload SARIF
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: eslint.sarif

  # ──────────────────────────────────────────────
  # Stage 2: SAST (Static Application Security Testing)
  # ──────────────────────────────────────────────
  sast:
    name: SAST - CodeQL
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: javascript
          # Add: python, java, csharp, go, ruby, cpp, swift as needed

      - name: Autobuild
        uses: github/codeql-action/autobuild@v3

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3

  # ──────────────────────────────────────────────
  # Stage 3: SCA (Software Composition Analysis)
  # ──────────────────────────────────────────────
  sca:
    name: SCA - Dependency Audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: npm audit
        run: npm audit --audit-level=high

      - name: Trivy vulnerability scan
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: fs
          scan-ref: .
          severity: HIGH,CRITICAL
          format: sarif
          output: trivy.sarif

      - name: Upload Trivy SARIF
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: trivy.sarif

  # ──────────────────────────────────────────────
  # Stage 4: Secrets Scan
  # ──────────────────────────────────────────────
  secrets:
    name: Secrets Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Full history for scanning all commits

      - name: Gitleaks scan
        uses: gitleaks/gitleaks-action@v2
        env:
          GITLEAKS_LICENSE: ${{ secrets.GITLEAKS_LICENSE }}

      - name: TruffleHog scan
        uses: trufflesecurity/trufflehog@main
        with:
          extra_args: --only-verified

  # ──────────────────────────────────────────────
  # Stage 5: Dependency Review (PR only)
  # ──────────────────────────────────────────────
  dependency-review:
    name: Dependency Review
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4

      - name: Dependency Review
        uses: actions/dependency-review-action@v4
        with:
          fail-on-severity: high
          deny-licenses: GPL-3.0, AGPL-3.0
          comment-summary-in-pr: always

  # ──────────────────────────────────────────────
  # Stage 6: License Check
  # ──────────────────────────────────────────────
  license-check:
    name: License Compliance
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install license-checker
        run: npm install -g license-checker

      - name: Check licenses
        run: |
          license-checker --failOn "GPL-3.0;AGPL-3.0;SSPL-1.0" \
                          --excludePrivatePackages \
                          --summary

  # ──────────────────────────────────────────────
  # Stage 7: SBOM (Software Bill of Materials)
  # ──────────────────────────────────────────────
  sbom:
    name: Generate SBOM
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Generate SBOM (CycloneDX)
        uses: CycloneDX/gh-node-module-generatebom@v1
        with:
          output: sbom.json

      - name: Upload SBOM artifact
        uses: actions/upload-artifact@v4
        with:
          name: sbom
          path: sbom.json
```

---

## Common Vulnerability Patterns and Fixes

### XSS (Cross-Site Scripting)

```javascript
// VULNERABLE - direct innerHTML assignment
element.innerHTML = userInput;

// FIXED - use textContent for plain text
element.textContent = userInput;

// FIXED - use DOMPurify when HTML is required
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(userInput);
```

### Prototype Pollution

```javascript
// VULNERABLE - recursive merge without prototype check
function merge(target, source) {
  for (const key in source) {
    target[key] = source[key];
  }
}

// FIXED - guard against __proto__ and constructor
function safeMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
    if (typeof source[key] === 'object' && source[key] !== null) {
      target[key] = target[key] || {};
      safeMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
}
```

### Open Redirect

```javascript
// VULNERABLE - unvalidated redirect
window.location.href = params.get('returnUrl');

// FIXED - allow only relative paths or whitelisted origins
function safeRedirect(url) {
  const allowed = ['https://example.com'];
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.origin === window.location.origin || allowed.includes(parsed.origin)) {
      window.location.href = parsed.href;
    }
  } catch {
    window.location.href = '/';
  }
}
```

### Insecure Deserialization

```javascript
// VULNERABLE - eval-based JSON parsing
const data = eval('(' + jsonString + ')');

// FIXED - use JSON.parse
const data = JSON.parse(jsonString);
```

### SQL Injection (Node.js)

```javascript
// VULNERABLE - string concatenation
db.query(`SELECT * FROM users WHERE id = '${userId}'`);

// FIXED - parameterised query
db.query('SELECT * FROM users WHERE id = $1', [userId]);
```

---

## Secret Detection Patterns

Patterns to watch for in code and configuration files:

| Pattern | Regex | Example Match |
|---------|-------|---------------|
| AWS Access Key | `AKIA[0-9A-Z]{16}` | `AKIAIOSFODNN7EXAMPLE` |
| AWS Secret Key | `(?i)aws_secret_access_key\s*=\s*\S+` | `aws_secret_access_key = wJal...` |
| GitHub Token | `gh[pousr]_[A-Za-z0-9_]{36,}` | `ghp_aBcDeFgHiJkLmNoPqR...` |
| Generic API Key | `(?i)(api[_-]?key|apikey)\s*[:=]\s*['"]?\S{16,}` | `api_key: "sk-abc123..."` |
| Private Key | `-----BEGIN (RSA\|EC\|DSA\|OPENSSH) PRIVATE KEY-----` | PEM header |
| Slack Webhook | `https://hooks\.slack\.com/services/T[A-Z0-9]+/B[A-Z0-9]+/[a-zA-Z0-9]+` | Webhook URL |
| Stripe Key | `sk_live_[0-9a-zA-Z]{24,}` | `sk_live_aBcDeFgH...` |
| Yoco Secret Key | `sk_live_[a-zA-Z0-9-]+` | `sk_live_abc-def-123` |
| Database URL | `(?i)(mysql\|postgres\|mongodb)://[^:]+:[^@]+@` | `postgres://user:pass@host` |
| JWT | `eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+` | `eyJhbGciOi...` |

### Prevention Checklist

- [ ] Add `.env` files to `.gitignore` before first commit
- [ ] Use GitHub repository secrets for CI/CD values
- [ ] Rotate any secret that has been committed (even if force-pushed away)
- [ ] Run `gitleaks detect` locally as a pre-commit hook
- [ ] Enable GitHub push protection (Settings > Code security > Secret scanning)

### Pre-commit Hook Setup

```bash
# Install gitleaks
brew install gitleaks

# .pre-commit-config.yaml
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.0
    hooks:
      - id: gitleaks
```

---

## Dependency Management Best Practices

1. **Pin exact versions** in `package-lock.json` / `yarn.lock` -- always commit lock files.
2. **Enable Dependabot** for automated PRs:
   ```yaml
   # .github/dependabot.yml
   version: 2
   updates:
     - package-ecosystem: npm
       directory: /
       schedule:
         interval: weekly
       open-pull-requests-limit: 10
       labels:
         - dependencies
       reviewers:
         - h3nryza
   ```
3. **Group minor/patch updates** to reduce PR noise:
   ```yaml
       groups:
         production-deps:
           patterns: ["*"]
           update-types: ["minor", "patch"]
   ```
4. **Audit regularly**: run `npm audit` in CI and locally.
5. **Remove unused dependencies**: use `npx depcheck` to find dead packages.
6. **Prefer well-maintained packages**: check last publish date, open issues, and download counts.

---

## When to Use GHAS (GitHub Advanced Security)

| Scenario | Use GHAS? | Reason |
|----------|-----------|--------|
| **Public repository** | Yes | GHAS is free for all public repos |
| **Private repository** | No | GHAS requires a paid licence per committer; use free alternatives |
| **Open-source project** | Yes | Full CodeQL, secret scanning, dependency review at no cost |

### Free Alternatives for Private Repos

| GHAS Feature | Free Alternative |
|--------------|------------------|
| CodeQL SAST | Semgrep (free tier), SonarCloud (free for OSS) |
| Secret scanning | Gitleaks, TruffleHog |
| Dependency review | `npm audit`, Trivy, Snyk (free tier) |
| SBOM | CycloneDX, Syft |

Rule of thumb: if the repo is public, turn on every GHAS feature. If it is private and you do not have a GHAS licence, use the free tools listed above in your workflow.

---

## SRI Hash Generation for CDN Scripts

Subresource Integrity (SRI) ensures CDN-hosted files have not been tampered with.

### Generate a Hash

```bash
# From a URL
curl -s https://cdn.example.com/lib.js | openssl dgst -sha384 -binary | openssl base64 -A

# From a local file
shasum -b -a 384 lib.js | awk '{print $1}' | xxd -r -p | openssl base64 -A
```

### Use in HTML

```html
<script
  src="https://cdn.example.com/lib@1.2.3/lib.min.js"
  integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxAh7..."
  crossorigin="anonymous"
></script>

<link
  rel="stylesheet"
  href="https://cdn.example.com/styles@2.0.0/styles.min.css"
  integrity="sha384-abc123..."
  crossorigin="anonymous"
/>
```

### Automation Script

```bash
#!/usr/bin/env bash
# generate-sri.sh - Generate SRI hashes for all CDN references in HTML files
set -euo pipefail

for file in $(grep -rl 'cdn\.' --include='*.html' .); do
  echo "=== $file ==="
  grep -oP 'src="(https://cdn[^"]+)"' "$file" | while read -r match; do
    url=$(echo "$match" | grep -oP 'https://[^"]+')
    hash=$(curl -s "$url" | openssl dgst -sha384 -binary | openssl base64 -A)
    echo "  $url"
    echo "  integrity=\"sha384-$hash\""
  done
done
```

---

## CSP Header Configuration

### Recommended Policy

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' https://cdn.example.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https:;
  connect-src 'self' https://api.example.com;
  frame-src 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
```

### Directive Reference

| Directive | Purpose | Typical Value |
|-----------|---------|---------------|
| `default-src` | Fallback for all resource types | `'self'` |
| `script-src` | JavaScript sources | `'self'` + CDN origins |
| `style-src` | CSS sources | `'self' 'unsafe-inline'` (if needed) |
| `img-src` | Image sources | `'self' data: https:` |
| `connect-src` | XHR / Fetch / WebSocket targets | `'self'` + API origins |
| `font-src` | Web font sources | `'self'` + font CDN |
| `frame-src` | iframe sources | `'none'` unless embedding |
| `object-src` | Plugin content (Flash, etc.) | `'none'` |
| `base-uri` | Restrict `<base>` element | `'self'` |
| `form-action` | Form submission targets | `'self'` |

### Implementation Methods

**HTML meta tag** (limited -- no `frame-ancestors` or `report-uri`):
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'">
```

**Netlify `_headers` file**:
```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

**GitHub Pages** (limited -- use meta tag since custom headers are not supported).

### Testing

1. Start with `Content-Security-Policy-Report-Only` to collect violations without blocking.
2. Monitor the browser console for CSP violation reports.
3. Once clean, switch to enforcing `Content-Security-Policy`.
4. Use https://csp-evaluator.withgoogle.com/ to validate your policy.
