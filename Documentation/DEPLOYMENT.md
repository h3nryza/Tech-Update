# Deployment Guide

This document describes how Tech Update is deployed, how the daily data collection works, and how to handle failures.

---

## GitHub Pages Setup

Tech Update is deployed as a static site via **GitHub Pages**.

### Configuration

- **Source**: The `main` branch root directory is published directly.
- **Workflow**: `.github/workflows/pages.yml` handles deployment.
- **Trigger**: Every push to `main` triggers a deployment.
- **URL**: The site is available at the GitHub Pages URL configured in the repository settings.

### How It Works

1. A push lands on `main` (human merge or automated bot commit).
2. The `pages.yml` workflow runs:
   - Checks out the repository.
   - Runs a pre-deploy secrets scan on committed files.
   - Uploads the entire repository root as a Pages artifact.
   - Deploys to GitHub Pages via `actions/deploy-pages@v4`.
3. The site is live within 1-2 minutes.

### Permissions

The workflow requires:
- `contents: read` -- to check out the repository.
- `pages: write` -- to upload and deploy the Pages artifact.
- `id-token: write` -- for GitHub's OIDC-based Pages deployment.

---

## Daily Collection Workflow

The data pipeline runs automatically every day to fetch fresh news from RSS feeds.

### Schedule

- **Cron**: `0 4 * * *` (04:00 UTC / 06:00 SAST, daily)
- **Workflow**: `.github/workflows/collect.yml`
- **Timeout**: 15 minutes

### Manual Trigger

You can trigger the collection manually at any time:

1. Go to the repository on GitHub.
2. Navigate to **Actions** > **Collect Tech News**.
3. Click **Run workflow** > **Run workflow**.

This uses the `workflow_dispatch` trigger defined in the workflow.

Alternatively, from the command line with the GitHub CLI:

```bash
gh workflow run collect.yml
```

---

## Data Pipeline

The collection workflow executes the following steps in order:

```
parse-sources.js --> collect.js --> build.js --> validate --> commit --> deploy
```

### Step-by-Step

| Step | Script/Command | What It Does |
|------|---------------|--------------|
| 1. Install | `npm ci` | Clean install of Node.js dependencies from lockfile |
| 2. Audit | `npm audit --audit-level=high` | Check for known vulnerabilities (non-blocking) |
| 3. Parse | `node parse-sources.js` | Reads source definitions and prepares the feed list |
| 4. Collect | `node collect.js` | Fetches RSS/Atom feeds and writes items to `data/news.json` |
| 5. Build | `node build.js` | Builds the search index and any derived data files |
| 6. Validate | Inline Node.js script | Validates every news item has `id`, `title`, and `url` fields; exits with error if validation fails |
| 7. Commit | `git commit` | Commits updated `data/` files as `github-actions[bot]` with message `chore: daily news collection YYYY-MM-DD` |
| 8. Push | `git push` | Pushes to `main`, which triggers the Pages deployment |

### No-Change Handling

If no new items are found (feeds have not updated), the workflow detects an empty `git diff --staged` and skips the commit. No deployment is triggered.

### Validation Details

The inline validation script checks:
- Every item in `news.items` has a non-empty `id`.
- Every item has a non-empty `title`.
- Every item has a non-empty `url`.
- Total counts are logged for monitoring.

If any item fails validation, the pipeline exits with code 1 and no commit is made.

---

## Rollback

Since the site is deployed from the `main` branch, rolling back is straightforward:

### Option 1: Revert Commit

```bash
git revert HEAD
git push
```

The revert commit lands on `main`, which triggers a fresh deployment with the previous state restored. This is the safest approach because it preserves history.

### Option 2: Reset to a Known Good Commit

If multiple commits need to be undone:

```bash
git log --oneline -10        # Find the last known good commit
git revert HEAD~3..HEAD      # Revert the last 3 commits
git push
```

### Option 3: Manual Data Fix

For data-only issues (bad items in `news.json`):

1. Edit `data/news.json` directly to remove problematic items.
2. Commit and push. The fix deploys automatically.

---

## Monitoring

### Checking Pipeline Status

1. Go to the repository on GitHub.
2. Navigate to **Actions**.
3. Check the **Collect Tech News** workflow for daily run status.
4. Check the **Deploy to GitHub Pages** workflow for deployment status.
5. Check the **Security Pipeline** and **CodeQL Analysis** workflows for security scan results.

### Common Failure Scenarios

| Symptom | Likely Cause | Resolution |
|---------|-------------|------------|
| Collect workflow fails at "Collect news" | RSS feed is down or returning invalid XML | Check the failing feed URL; remove or disable the source temporarily |
| Collect workflow fails at "Validate data" | A news item is missing required fields | Check the collection script output for the specific index; fix in `collect.js` |
| Collect workflow times out (>15 min) | Too many sources or a feed is hanging | Increase timeout or add a per-feed timeout in `collect.js` |
| Pages deployment fails | GitHub Pages configuration issue | Check repository Settings > Pages; ensure source is set correctly |
| Security pipeline fails | npm audit found high-severity vulnerability | Run `cd scripts && npm audit` locally; update the affected package |

### Notifications

Configure GitHub notification settings to receive alerts on workflow failures:
- Repository > Settings > Notifications, or
- Watch the repository with "Custom" > "Workflows" selected.

---

## Environment Requirements

### GitHub Actions (CI/CD)
- **Runner**: `ubuntu-latest`
- **Node.js**: 20 (with npm cache enabled)
- **npm**: Uses `npm ci` with `scripts/package-lock.json`

### Local Development
- **Node.js**: 20 or later
- **npm**: 9 or later
- **Browser**: Any modern browser to view `index.html`

No build step is required for the frontend. The HTML, CSS, and JS files are served as-is.
