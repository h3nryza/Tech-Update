# Software Development Life Cycle (SDLC)

This document describes the full SDLC for Tech Update -- from ideation through deployment, monitoring, and feedback. It covers the engineering processes, security gates, testing strategy, and automation that ensure reliable, secure delivery.

---

## SDLC Overview

Tech Update follows a **continuous delivery** model with daily automated deployments gated by a comprehensive security pipeline. The cycle has six phases:

```mermaid
graph LR
    PLAN["1. Plan"] --> DEVELOP["2. Develop"]
    DEVELOP --> TEST["3. Test"]
    TEST --> SECURE["4. Secure"]
    SECURE --> DEPLOY["5. Deploy"]
    DEPLOY --> MONITOR["6. Monitor"]
    MONITOR --> PLAN

    style PLAN fill:#4CAF50,color:#fff
    style DEVELOP fill:#2196F3,color:#fff
    style TEST fill:#FF9800,color:#fff
    style SECURE fill:#f44336,color:#fff
    style DEPLOY fill:#9C27B0,color:#fff
    style MONITOR fill:#607D8B,color:#fff
```

---

## Phase 1: Plan

### Inputs
- Feature requests (GitHub Issues)
- Security advisories (Dependabot, Trivy, CodeQL)
- Feed source suggestions
- OSSF Scorecard recommendations

### Activities
- Define requirements in GitHub Issues
- Assign labels: `feature`, `fix`, `sources`, `security`, `docs`, `ci`
- Prioritize in project board

### Outputs
- Labeled, prioritized backlog
- Branch created from `main` using naming convention

### Branch Naming

| Prefix | Purpose |
|--------|---------|
| `feature/*` | New functionality |
| `fix/*` | Bug fixes |
| `chore/*` | Maintenance, deps, CI |
| `docs/*` | Documentation only |
| `sources/*` | Adding/updating feed sources |
| `security/*` | Security fixes |

---

## Phase 2: Develop

### Inputs
- Branch from Phase 1
- `feeds.md` for source changes
- `data/config.json` for UI changes
- `scripts/` for pipeline changes

### Activities

```mermaid
flowchart TD
    A["Create branch"] --> B{"What type of change?"}
    B -->|New source| C["Edit feeds.md<br/>Add one line"]
    B -->|New tab| D["Edit config.json<br/>+ feeds.md section"]
    B -->|Pipeline change| E["Edit scripts/*.js"]
    B -->|UI change| F["Edit index.html / js/"]
    B -->|Security fix| G["Edit workflows / config"]

    C --> H["Run local tests"]
    D --> H
    E --> H
    F --> H
    G --> H

    H --> I["Commit & push"]
    I --> J["Open Pull Request"]
```

### Local Development

```bash
# Install dependencies (first time)
cd scripts && npm ci

# Parse feeds and collect news
npm run full

# Run test suite
npm test

# Run with verbose output
npm run test:verbose

# Test RSS reachability (slow, hits all URLs)
npm run test:live
```

### Code Standards
- ES modules (`import`/`export`)
- No `eval()`, `new Function()`, or implied eval (enforced by ESLint)
- Alpine.js `x-text` only (never `x-html`) for feed content
- SRI hashes on all CDN scripts
- No secrets or credentials in code

---

## Phase 3: Test

### Test Strategy

Tech Update has **four layers** of testing:

```mermaid
graph TB
    subgraph "Layer 1: Unit / Data Tests (35 checks)"
        F1["feeds.md format validation"]
        F2["sources.json integrity"]
        F3["news.json data integrity"]
        F4["config.json schema"]
        F5["Tag consistency"]
        F6["YouTube channel resolution"]
        F7["Reddit URL format"]
        F8["Workflow YAML validation"]
        F9["Secrets pattern scan"]
        F10["Duplicate detection"]
    end

    subgraph "Layer 2: Integration Tests (Playwright)"
        P1["Search functionality"]
        P2["Tab navigation"]
        P3["Filter and sort"]
        P4["Export (CSV/JSON/PDF)"]
        P5["Mobile responsiveness"]
        P6["Keyboard navigation"]
    end

    subgraph "Layer 3: Security Tests (CI)"
        S1["npm audit (high/critical)"]
        S2["gitleaks (full history)"]
        S3["Trivy CVE scan"]
        S4["CodeQL SAST"]
        S5["License compliance"]
        S6["Dependency review (PRs)"]
    end

    subgraph "Layer 4: Live Tests (optional)"
        L1["RSS URL reachability"]
        L2["Feed content freshness"]
    end
```

### Test Suite Details (`scripts/test-feeds.js`)

| # | Test | What it checks | Blocking? |
|---|------|----------------|-----------|
| 1 | feeds.md format | All 321 feed lines have valid `type \| name \| url` format | Yes |
| 2 | feeds.md sections | Products and Topics headers exist, required products present | Yes |
| 3 | sources.json total | `total` field matches actual array length | Yes |
| 4 | sources.json fields | Every source has `id`, `name`, `type`, `url`, `tags` | Yes |
| 5 | sources.json no duplicate IDs | SHA-256 IDs are unique | Yes |
| 6 | sources.json no duplicate URLs | Normalized URLs are unique | Yes |
| 7 | sources.json valid types | All types are blog/youtube/podcast/newsletter/forum/changelog | Yes |
| 8 | news.json exists | File is present and parseable | Yes |
| 9 | news.json items | All items have `id`, `title`, `url`, `source_name` | Yes |
| 10 | news.json no duplicates | No duplicate item IDs | Yes |
| 11 | news.json freshness | At least some items from last 30 days | Yes |
| 12 | config.json schema | products/topics/software arrays exist with required fields | Yes |
| 13 | config.json children | All children have `id` and `label` | Yes |
| 14 | Tag consistency | All source tags exist in config.json | Yes |
| 15 | Orphan tag check | Config tags without sources (warning only) | No |
| 16 | YouTube RSS resolution | All YouTube sources have channel ID RSS URLs | Yes |
| 17 | YouTube RSS format | URLs match `youtube.com/feeds/videos.xml?channel_id=` | Yes |
| 18 | Reddit JSON endpoints | All Reddit sources have `.json?limit=25` URLs | Yes |
| 19-22 | Workflow YAML | collect/pages/security/codeql.yml exist with name/on/jobs | Yes |
| 23 | Security gate | security.yml has security-gate job | Yes |
| 24 | Deploy gate | pages.yml uses workflow_run trigger | Yes |
| 25 | Audit blocking | collect.yml npm audit has no `\|\| true` | Yes |
| 26-30 | Secrets patterns | No AWS keys, OpenAI keys, GitHub PATs, passwords in code | Yes |

### Running Tests

```bash
# Quick (offline, ~1 second)
cd scripts && npm test

# Verbose (shows details per test)
npm run test:verbose

# Live (tests RSS URL reachability -- takes ~2 minutes)
npm run test:live
```

---

## Phase 4: Secure

### Security Pipeline Architecture

```mermaid
flowchart TD
    subgraph "Triggers"
        PUSH["Push to main"]
        PR["Pull Request"]
        DAILY["Daily 04:00 UTC"]
        MANUAL["Manual dispatch"]
    end

    subgraph "Security Jobs (security.yml)"
        AUDIT["npm audit<br/>--audit-level=high"]
        GITLEAKS["gitleaks<br/>full git history"]
        TRIVY["Trivy<br/>HIGH + CRITICAL CVEs"]
        LICENSE["license-checker<br/>GPL/AGPL/SSPL blocked"]
        DEPREV["Dependency Review<br/>(PRs only)"]
    end

    subgraph "SAST (codeql.yml)"
        CODEQL["CodeQL Analysis<br/>security-extended<br/>security-and-quality"]
    end

    subgraph "Gate"
        GATE{"Security Gate<br/>ALL must pass"}
    end

    subgraph "Scorecard (scorecard.yml)"
        OSSF["OSSF Scorecard<br/>Weekly Monday 05:00 UTC"]
    end

    PUSH --> AUDIT & GITLEAKS & TRIVY & LICENSE & CODEQL
    PR --> AUDIT & GITLEAKS & TRIVY & LICENSE & DEPREV & CODEQL
    DAILY --> AUDIT & GITLEAKS & TRIVY & LICENSE
    MANUAL --> AUDIT & GITLEAKS & TRIVY & LICENSE

    AUDIT --> GATE
    GITLEAKS --> GATE
    TRIVY --> GATE
    LICENSE --> GATE

    GATE -->|PASS| DEPLOY["Deploy to<br/>GitHub Pages"]
    GATE -->|FAIL| BLOCK["Deploy BLOCKED"]

    CODEQL --> SARIF["GitHub Security Tab"]
    TRIVY --> SARIF
    OSSF --> SARIF

    style GATE fill:#f44336,color:#fff
    style BLOCK fill:#f44336,color:#fff
    style DEPLOY fill:#4CAF50,color:#fff
```

### Security Tools

| Tool | What it does | Severity threshold | Schedule |
|------|-------------|-------------------|----------|
| **npm audit** | Checks npm dependencies for known CVEs | HIGH / CRITICAL | Every push, PR, daily |
| **gitleaks** | Scans full git history for leaked secrets | Any match | Every push, PR, daily |
| **Trivy** | Filesystem vulnerability scan for CVEs | HIGH / CRITICAL | Every push, PR, daily |
| **CodeQL** | Static application security testing (SAST) | security-extended | Every push, PR, weekly |
| **license-checker** | Blocks GPL/AGPL/SSPL/EUPL licenses | Any match | Every push, PR, daily |
| **Dependency Review** | Reviews new deps in PRs for vulns | HIGH / deny GPL | PRs only |
| **OSSF Scorecard** | Overall repo security posture grade | Advisory | Weekly |
| **Dependabot** | Auto-creates PRs for outdated deps | All severities | Daily |

### Security Gate Rules

The deploy to GitHub Pages **only proceeds** if:

1. `dependency-audit` job: **SUCCESS**
2. `secrets-scan` job: **SUCCESS**
3. `trivy-scan` job: **SUCCESS**
4. `license-check` job: **SUCCESS**

If **any** of these fail, the security gate fails and no deployment occurs.

---

## Phase 5: Deploy

### Deployment Flow

```mermaid
sequenceDiagram
    participant DEV as Developer
    participant GH as GitHub
    participant SEC as Security Pipeline
    participant GATE as Security Gate
    participant GP as GitHub Pages

    DEV->>GH: Push to main / merge PR
    GH->>SEC: Trigger security.yml
    par Security checks
        SEC->>SEC: npm audit
        SEC->>SEC: gitleaks
        SEC->>SEC: Trivy scan
        SEC->>SEC: License check
    end
    SEC->>GATE: Report results
    alt All checks pass
        GATE->>GP: Trigger pages.yml
        GP->>GP: Pre-deploy secrets scan
        GP->>GP: Upload artifact
        GP->>GP: Deploy to GitHub Pages
        GP-->>DEV: Site live (1-2 min)
    else Any check fails
        GATE-->>DEV: Deploy BLOCKED
        GATE-->>GH: Security alert created
    end
```

### Deployment Triggers

| Trigger | Security gate | Deploy |
|---------|--------------|--------|
| Push to `main` | Required (auto) | After security passes |
| Pull Request merge | Required (auto) | After security passes |
| Manual `workflow_dispatch` on pages.yml | Bypassed | Immediate |
| Daily collection commit | Required (auto) | After security passes |

### Rollback

Since the site is static with no database:
- **Revert commit**: `git revert <sha>` and push
- **Data rollback**: weekly snapshots in `data/archive/`
- **Emergency**: manually trigger pages.yml to redeploy any commit

---

## Phase 6: Monitor

### What is Monitored

| Signal | Source | Frequency |
|--------|--------|-----------|
| Feed collection success | GitHub Actions logs | Daily |
| Data freshness (items < 30 days) | `test-feeds.js` | Every collection run |
| Security vulnerabilities | Trivy + npm audit + CodeQL | Daily |
| Dependency updates available | Dependabot PRs | Daily |
| Repo security posture | OSSF Scorecard | Weekly |
| Secrets exposure | gitleaks | Every push |

### Alerts

- **Dependabot**: auto-creates PRs for vulnerable dependencies
- **CodeQL**: creates security alerts in GitHub Security tab
- **Trivy**: uploads SARIF to GitHub Security tab
- **OSSF Scorecard**: publishes results to OpenSSF

### Feedback Loop

```mermaid
flowchart LR
    M["Monitor"] -->|"Vuln found"| I["Issue created"]
    M -->|"Dep outdated"| D["Dependabot PR"]
    M -->|"Feed broken"| F["Fix feeds.md"]
    I --> PLAN["Plan"]
    D --> DEVELOP["Develop"]
    F --> DEVELOP
    PLAN --> DEVELOP --> TEST["Test"] --> SECURE["Secure"] --> DEPLOY["Deploy"] --> M
```

---

## Complete SDLC Lifecycle

```mermaid
graph TD
    subgraph "1. PLAN"
        P1["GitHub Issues"]
        P2["Prioritize backlog"]
        P3["Create branch"]
    end

    subgraph "2. DEVELOP"
        D1["Edit feeds.md / config.json / scripts"]
        D2["Local dev + test"]
        D3["Commit & push"]
        D4["Open PR"]
    end

    subgraph "3. TEST"
        T1["test-feeds.js (35 checks)"]
        T2["Playwright E2E"]
        T3["Manual review"]
    end

    subgraph "4. SECURE"
        S1["npm audit"]
        S2["gitleaks"]
        S3["Trivy CVE"]
        S4["CodeQL SAST"]
        S5["License check"]
        S6["Dependency review"]
        S7["Security Gate"]
    end

    subgraph "5. DEPLOY"
        DEP1["Pre-deploy secrets scan"]
        DEP2["GitHub Pages deploy"]
        DEP3["Site live"]
    end

    subgraph "6. MONITOR"
        M1["Daily feed collection"]
        M2["Dependabot PRs"]
        M3["OSSF Scorecard"]
        M4["GitHub Security alerts"]
    end

    P1 --> P2 --> P3
    P3 --> D1 --> D2 --> D3 --> D4
    D4 --> T1 & T2 & T3
    T1 --> S1 & S2 & S3 & S4 & S5 & S6
    S1 & S2 & S3 & S4 & S5 --> S7
    S7 -->|PASS| DEP1 --> DEP2 --> DEP3
    S7 -->|FAIL| D1
    DEP3 --> M1 & M2 & M3 & M4
    M4 -->|"New vuln"| P1

    style S7 fill:#f44336,color:#fff
    style DEP3 fill:#4CAF50,color:#fff
```

---

## Environments

| Environment | URL | Trigger | Security gate |
|-------------|-----|---------|---------------|
| **Local** | `localhost` (open index.html) | Manual | None (use `npm test`) |
| **PR Preview** | N/A (static site) | PR opened | Full security pipeline |
| **Production** | GitHub Pages URL | Push to main | Full security pipeline + deploy gate |

---

## Tools Summary

| Category | Tool | Purpose |
|----------|------|---------|
| **Language** | JavaScript (ES modules, Node.js 20) | Pipeline scripts |
| **Frontend** | Alpine.js + Tailwind CSS | Reactive SPA |
| **CI/CD** | GitHub Actions | Automation |
| **Security** | gitleaks, Trivy, CodeQL, npm audit, OSSF Scorecard | DevSecOps |
| **Dependencies** | Dependabot (daily) | Version management |
| **Testing** | Custom test suite (test-feeds.js), Playwright | Validation |
| **Hosting** | GitHub Pages | Static site delivery |
| **Data** | RSS/Atom feeds, Reddit JSON | Content aggregation |
| **Package** | rss-parser | Feed parsing |

---

## Compliance Matrix

| Standard | Status | Notes |
|----------|--------|-------|
| OWASP Top 10 | Pass (9/10 N/A or Pass) | Static site eliminates most categories |
| Supply chain (SLSA) | Partial | SRI hashes, Dependabot, SBOM generation |
| Secrets management | Pass | gitleaks + pre-deploy scan + .gitignore |
| License compliance | Pass | GPL/AGPL/SSPL/EUPL blocked |
| Accessibility (WCAG 2.1 AA) | Partial | ARIA landmarks, skip nav, keyboard accessible |

---

## Diagram Files

- **Mermaid**: All diagrams in this document render natively on GitHub
- **draw.io**: See [`Documentation/sdlc.drawio`](sdlc.drawio) for an editable version of the SDLC lifecycle diagram
