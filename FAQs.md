# Frequently Asked Questions

## Table of Contents

- [General](#general)
- [Getting Started](#getting-started)
- [Secrets & Passwords](#secrets--passwords)
- [Git Workflow: Stage, Commit, Push](#git-workflow-stage-commit-push)
- [Pull Requests](#pull-requests)
- [Releases](#releases)
- [Data & Collection](#data--collection)
- [Features](#features)
- [Security](#security)
- [Deployment & Hosting](#deployment--hosting)
- [Troubleshooting](#troubleshooting)

---

## General

**Q: What is Tech Update?**
A: A static dashboard that aggregates tech news across 13 products and 9+ topics from 386+ curated RSS/Atom sources. It runs on GitHub Pages with no backend, no database, and no authentication.

**Q: How often is data updated?**
A: Daily at 06:00 SAST (04:00 UTC) via GitHub Actions. You can also trigger collection manually from the Actions tab or CLI.

**Q: What tech stack does this use?**
A: Frontend: Alpine.js + Tailwind CSS (CDN-loaded, no build step). Backend: Node.js scripts for RSS collection via GitHub Actions. Hosting: GitHub Pages. All data is stored as JSON files in the `data/` directory.

**Q: Can I use this for my own topics?**
A: Yes. Add a new directory under `products/`, create a `claude.md` with sources, update `consolidated.md`, and run `parse-sources.js`. See [HOW_TO_ADD.md](HOW_TO_ADD.md) for detailed instructions.

---

## Getting Started

**Q: How do I set up the project locally?**
A: Clone the repo and install dependencies for the collection scripts:

```bash
git clone https://github.com/h3nryza/Tech-Update.git
cd Tech-Update
cd scripts && npm ci
```

To view the site, open `index.html` in any browser. No build step is required.

**Q: How do I run data collection locally?**
A:
```bash
cd scripts
node parse-sources.js    # Validate feed definitions
node collect.js          # Fetch RSS/Atom feeds → data/news.json
node build.js            # Build search index → data/index.json + data/stats.json
```

**Q: What Node.js version do I need?**
A: Node.js 20 or later, with npm 9 or later.

---

## Secrets & Passwords

**Q: Where should I store secrets and passwords?**
A: **Never commit secrets to the repository.** Use the following approaches:

| Secret Type | Where to Store | How to Use |
|-------------|---------------|------------|
| API keys (GitHub PAT, etc.) | **GitHub Secrets** (Settings > Secrets and variables > Actions) | Reference as `${{ secrets.SECRET_NAME }}` in workflows |
| Local dev secrets | **`.env` file** in the project root | `.env` is in `.gitignore` — it will never be committed |
| CI/CD tokens | **GitHub Secrets** | Used automatically by GitHub Actions (e.g., `GITHUB_TOKEN`) |
| NPM tokens | **GitHub Secrets** | Add as `NPM_TOKEN` secret if publishing packages |

**Q: How do I add a secret to GitHub Actions?**
A:
1. Go to your repository on GitHub.
2. Navigate to **Settings** > **Secrets and variables** > **Actions**.
3. Click **New repository secret**.
4. Enter the **Name** (e.g., `API_KEY`) and **Value**.
5. Click **Add secret**.
6. Reference it in a workflow:

```yaml
# .github/workflows/example.yml
jobs:
  build:
    steps:
      - name: Use secret
        env:
          MY_API_KEY: ${{ secrets.API_KEY }}
        run: echo "Secret is available as $MY_API_KEY"
```

**Q: How do I use a `.env` file locally?**
A: Create a `.env` file in the project root (it's already in `.gitignore`):

```bash
# .env — NEVER commit this file
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Load it in Node.js scripts:
```javascript
import { config } from 'dotenv';
config();
console.log(process.env.GITHUB_TOKEN);
```

Or source it in bash:
```bash
source .env
echo $GITHUB_TOKEN
```

**Q: What secret patterns are automatically scanned?**
A: The CI/CD pipeline scans for:
- AWS access keys (`AKIA...`)
- OpenAI API keys (`sk-...`)
- GitHub Personal Access Tokens (`ghp_...`)
- Hardcoded passwords (`password = "..."`)
- Full git history scan via **gitleaks**

If a secret is detected, the pipeline will warn you before deployment.

**Q: I accidentally committed a secret. What do I do?**
A:
1. **Immediately rotate the secret** — generate a new key/token and revoke the old one.
2. Remove it from the code and commit the fix.
3. Note: The secret is still in git history. For sensitive leaks, use `git filter-branch` or [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/) to purge it from history.
4. Force-push the cleaned history (requires maintainer approval).

---

## Git Workflow: Stage, Commit, Push

**Q: What is the basic workflow for making changes?**
A:

```bash
# 1. Create a branch from main
git checkout main
git pull origin main
git checkout -b feature/my-new-feature

# 2. Make your changes (edit files)

# 3. Stage your changes
git add js/app.js css/style.css          # Stage specific files
# OR
git add .                                 # Stage all changes (review first!)

# 4. Commit with a conventional message
git commit -m "feat: add dark mode toggle animation"

# 5. Push to remote
git push -u origin feature/my-new-feature
```

**Q: How do I stage files?**
A: Staging tells git which changes to include in your next commit.

```bash
# Stage specific files (recommended)
git add js/app.js
git add css/tokens.css data/config.json

# Stage all changes in a directory
git add js/

# Stage all tracked file changes
git add -u

# Stage everything (use with caution — review with git status first)
git add .

# Unstage a file (undo git add)
git restore --staged js/app.js

# Check what's staged vs unstaged
git status
```

**Q: What commit message format should I use?**
A: Use [Conventional Commits](https://www.conventionalcommits.org/):

```
type: short description (lowercase, imperative mood, <72 chars)
```

| Type       | When to Use                             | Example |
|------------|----------------------------------------|---------|
| `feat`     | New feature or capability               | `feat: add Kubernetes product tab` |
| `fix`      | Bug fix                                 | `fix: handle empty RSS feed response` |
| `chore`    | Maintenance, deps, CI                   | `chore: update Alpine.js SRI hash` |
| `docs`     | Documentation only                      | `docs: add deployment guide` |
| `refactor` | Code restructure (no feature/fix)       | `refactor: extract search logic to module` |
| `style`    | Formatting, CSS-only changes            | `style: fix sidebar alignment in dark mode` |
| `sources`  | Adding/updating news sources            | `sources: add AWS Security Blog feed` |

**Q: How do I push my branch?**
A:
```bash
# First push (set upstream tracking)
git push -u origin feature/my-branch-name

# Subsequent pushes (upstream already set)
git push

# Check remote tracking status
git branch -vv
```

**Q: What branch naming convention should I use?**
A:

| Prefix       | Use For                        | Example                          |
|--------------|-------------------------------|----------------------------------|
| `feature/*`  | New functionality             | `feature/add-kubernetes-tab`     |
| `fix/*`      | Bug fixes                     | `fix/rss-date-parsing`           |
| `chore/*`    | Maintenance, deps, CI         | `chore/update-alpine-sri`        |
| `docs/*`     | Documentation changes only    | `docs/update-deployment-guide`   |
| `sources/*`  | Adding or updating sources    | `sources/add-medium-blogs`       |

**Q: How do I view what I'm about to commit?**
A:
```bash
# See unstaged changes (working directory vs last commit)
git diff

# See staged changes (what will be committed)
git diff --staged

# See both staged and unstaged file names
git status

# See the last few commits
git log --oneline -5
```

**Q: How do I undo changes before committing?**
A:
```bash
# Discard changes to a specific file (revert to last commit)
git checkout -- js/app.js

# Unstage a file but keep the changes
git restore --staged js/app.js

# Undo the last commit but keep the changes staged
git reset --soft HEAD~1

# Undo the last commit and unstage the changes
git reset HEAD~1
```

---

## Pull Requests

**Q: How do I create a pull request?**
A:
1. Push your branch to the remote:
   ```bash
   git push -u origin feature/my-feature
   ```
2. Create the PR via GitHub CLI:
   ```bash
   gh pr create --title "feat: add Kubernetes tab" --body "## Summary
   - Added Kubernetes as a new product tab
   - Configured 12 RSS feed sources

   ## Test plan
   - [ ] Verify tab appears in navigation
   - [ ] Run collection and confirm data populates
   - [ ] Test dark mode rendering"
   ```
3. Or open a PR from the GitHub web interface at your repository's Pull Requests tab.

**Q: What happens when I open a PR?**
A: Several automated checks run:
- **Auto-labeling** — Labels are applied based on which files changed (e.g., `frontend`, `sources`, `docs`).
- **Security pipeline** — npm audit, ESLint security rules, gitleaks secrets scan, CodeQL SAST.
- **Dependency review** — New dependencies are checked for vulnerabilities and license compatibility.
- **Release drafter** — Your PR is categorized in the next draft release notes.

**Q: What are the merge requirements?**
A:
- At least **1 approving review**.
- All CI checks must pass (security pipeline, CodeQL).
- Branch must be up to date with `main`.

**Q: Which merge strategy should I use?**
A:
- **Squash and merge** — For single-purpose PRs (most common). Combines all commits into one clean commit.
- **Merge commit** — For larger feature branches where individual commit history is valuable.
- Always **delete the branch** after merging.

**Q: How do I review and manage PRs from the CLI?**
A:
```bash
# List open PRs
gh pr list

# View a specific PR
gh pr view 42

# Check out a PR locally for testing
gh pr checkout 42

# Approve a PR
gh pr review 42 --approve

# Merge a PR (squash)
gh pr merge 42 --squash --delete-branch

# View PR checks/status
gh pr checks 42
```

**Q: How do I update my PR with changes from main?**
A:
```bash
# Option 1: Rebase (cleaner history)
git fetch origin
git rebase origin/main
git push --force-with-lease

# Option 2: Merge main into your branch
git fetch origin
git merge origin/main
git push
```

---

## Releases

**Q: How does the release process work?**
A: Tech Update uses **automated release drafting** with manual publishing:

1. Every PR merged to `main` is auto-categorized in a **draft release**.
2. The version is auto-resolved based on PR labels:
   - `breaking` label → **major** bump (e.g., 1.0.0 → 2.0.0)
   - `feature`/`enhancement`/`sources` labels → **minor** bump (e.g., 1.0.0 → 1.1.0)
   - Everything else → **patch** bump (e.g., 1.0.0 → 1.0.1)
3. When ready, you **manually publish** the draft release.

**Q: How do I publish a release via the GitHub UI?**
A:
1. Go to [Releases](https://github.com/h3nryza/Tech-Update/releases).
2. Find the **draft release** (it's auto-generated from merged PRs).
3. Review the auto-generated release notes.
4. Edit the version tag if needed.
5. Click **Publish release**.

**Q: How do I publish a release via the CLI?**
A:
```bash
# Option 1: Publish the existing draft
gh release list                              # Find the draft release tag
gh release edit v1.2.0 --draft=false         # Publish it

# Option 2: Create a new tagged release manually
git tag -a v1.2.0 -m "v1.2.0 - Add Kubernetes tab and fix search"
git push origin v1.2.0
gh release create v1.2.0 --generate-notes
```

**Q: What version number should I use?**
A: Follow **Semantic Versioning** (`MAJOR.MINOR.PATCH`):

| Bump      | When                                              | Example Change |
|-----------|---------------------------------------------------|----------------|
| **MAJOR** | Breaking changes to config/data schema or feature removal | Changing `config.json` structure |
| **MINOR** | New features, new sources, new tabs               | Adding a product tab |
| **PATCH** | Bug fixes, dependency updates, doc fixes          | Fixing a broken RSS feed |

The release drafter auto-resolves this based on PR labels — you usually don't need to calculate it manually.

**Q: What is the release cadence?**
A:

| Type      | Frequency                         |
|-----------|-----------------------------------|
| **Patch** | As needed (bug fixes, dep updates)|
| **Minor** | Bi-weekly or when meaningful features land |
| **Major** | Rare (breaking schema/config changes) |

Note: Daily news collection commits do **not** trigger releases. They happen automatically without versioning.

**Q: How do I view the current release and release history?**
A:
```bash
# List all releases
gh release list

# View the latest release
gh release view

# View a specific release
gh release view v1.0.0

# View release notes in the browser
gh release view v1.0.0 --web
```

**Q: How are release notes generated?**
A: The `.github/release-drafter.yml` config groups merged PRs by label:

| Section                  | Labels                        |
|--------------------------|-------------------------------|
| New Sources & Data       | `sources`, `data`             |
| Frontend                 | `frontend`, `enhancement`     |
| Bug Fixes                | `bug`, `fix`                  |
| Security                 | `security`, `dependencies`    |
| CI/CD                    | `ci`                          |
| Documentation            | `docs`                        |
| Config & Infrastructure  | `config`                      |

---

## Data & Collection

**Q: Where does the news data come from?**
A: RSS/Atom feeds from blogs, YouTube channels, and Reddit subreddits. See `sites_used.md` for the complete list of 386+ sources.

**Q: How far back does the data go?**
A: 365 days rolling. Items older than a year are pruned during each build. Weekly snapshots are archived in `data/archive/`.

**Q: Why are some tabs empty?**
A: If collection hasn't run yet or no items matched that tab's tags. Run collection locally:
```bash
cd scripts && node collect.js && node build.js
```

**Q: How do I add a new RSS source?**
A: Use the interactive helper script:
```bash
cd scripts && bash add-source.sh
```

Or manually edit `data/sources.json` and add an entry with `id`, `name`, `type`, `url`, and `tags` fields. See [HOW_TO_ADD.md](HOW_TO_ADD.md) for details.

**Q: How do I trigger data collection manually?**
A:
```bash
# Via GitHub CLI
gh workflow run collect.yml

# Via GitHub UI
# Navigate to Actions > Collect Tech News > Run workflow
```

---

## Features

**Q: How does search work?**
A: Type words to search titles, TLDRs, and source names. Prefix with `#` to search tags (e.g., `#security`, `#video`). Toggle "GLOBAL" to search across all tabs.

**Q: Can I export data?**
A: Yes. Use the CSV, JSON, or PDF export buttons in the footer. Exports include only the currently filtered/visible items.

**Q: Does it work offline?**
A: Partially. The HTML, CSS, and JS load from CDN so they need internet. Once loaded, the cached data works offline. Full PWA support is planned.

---

## Security

**Q: What security measures are in place?**
A:
- **Content Security Policy (CSP)** — Restricts which domains can load scripts, styles, and other resources.
- **Subresource Integrity (SRI)** — SHA-384 hashes on all CDN-loaded scripts prevent tampering.
- **Secrets scanning** — gitleaks scans full git history; pre-deploy scans catch common patterns.
- **Dependency auditing** — `npm audit` on every collection run and PR; Dependabot for weekly updates.
- **CodeQL SAST** — Static analysis on push, PR, and weekly.
- **License compliance** — Blocks GPL-3.0, AGPL, SSPL, EUPL dependencies.
- **SBOM generation** — CycloneDX Software Bill of Materials on every security scan.

**Q: How do I report a security vulnerability?**
A: **Do not open a public issue.** Instead:
1. Open a **private security advisory** via Settings > Security > Advisories on GitHub.
2. Or contact the maintainer directly via email.
3. The maintainer will acknowledge within 48 hours and aim to fix within 7 days.

---

## Deployment & Hosting

**Q: How is the site deployed?**
A: Every push to `main` triggers the `pages.yml` workflow, which deploys to GitHub Pages within 1-2 minutes. The workflow runs a secrets scan before deploying.

**Q: Can I self-host this?**
A: Yes. It's a static site — any web server that serves HTML files will work (nginx, Apache, Netlify, Vercel, etc.).

**Q: How do I roll back a bad deployment?**
A:
```bash
# Option 1: Revert the last commit (safest — preserves history)
git revert HEAD
git push

# Option 2: Revert multiple commits
git log --oneline -10        # Find the last known good commit
git revert HEAD~3..HEAD      # Revert the last 3 commits
git push
```

---

## Troubleshooting

**Q: The collection workflow failed. What do I check?**
A:

| Symptom | Likely Cause | Resolution |
|---------|-------------|------------|
| Fails at "Collect news" | RSS feed is down or returning invalid XML | Check the failing feed URL; disable the source temporarily |
| Fails at "Validate data" | A news item is missing required fields | Check output for the specific index; fix in `collect.js` |
| Workflow times out (>15 min) | Too many sources or a feed is hanging | Increase timeout or add a per-feed timeout |
| Pages deployment fails | GitHub Pages config issue | Check Settings > Pages; ensure source is correct |
| Security pipeline fails | npm audit found high-severity vuln | Run `cd scripts && npm audit` locally; update the package |

**Q: How do I check workflow status from the CLI?**
A:
```bash
# List recent workflow runs
gh run list

# View a specific run
gh run view <run-id>

# Watch a running workflow
gh run watch <run-id>

# View workflow logs
gh run view <run-id> --log
```

**Q: Git says my branch is behind main. How do I fix it?**
A:
```bash
git fetch origin
git rebase origin/main
git push --force-with-lease    # Only if you've already pushed the branch
```

**Q: I see merge conflicts. How do I resolve them?**
A:
```bash
# During a rebase or merge, git will mark conflicting files
git status                     # See which files have conflicts

# Open the conflicting file, resolve the markers:
#   <<<<<<< HEAD
#   (your changes)
#   =======
#   (incoming changes)
#   >>>>>>> main

# After resolving, stage and continue
git add <resolved-file>
git rebase --continue          # If rebasing
# OR
git commit                     # If merging
```
