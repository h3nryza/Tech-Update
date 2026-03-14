# Contributing to Tech Update

Thank you for your interest in contributing to Tech Update. This guide covers the workflow, conventions, and requirements for submitting changes.

---

## Branch Naming

All branches must use one of the following prefixes:

| Prefix       | Use For                           | Example                         |
|--------------|-----------------------------------|---------------------------------|
| `feature/*`  | New functionality                 | `feature/add-kubernetes-tab`    |
| `fix/*`      | Bug fixes                         | `fix/rss-date-parsing`          |
| `chore/*`    | Maintenance, dependencies, CI     | `chore/update-alpine-sri`       |
| `docs/*`     | Documentation changes only        | `docs/update-deployment-guide`  |
| `sources/*`  | Adding or updating news sources   | `sources/add-medium-blogs`      |

---

## Commit Message Format

Use the conventional commit format:

```
type: short description
```

Types:

| Type       | When to Use                                 |
|------------|---------------------------------------------|
| `feat`     | A new feature or capability                 |
| `fix`      | A bug fix                                   |
| `chore`    | Maintenance, dependency updates, CI changes |
| `docs`     | Documentation only                          |
| `refactor` | Code change that neither fixes nor adds     |
| `style`    | Formatting, whitespace, CSS-only changes    |
| `test`     | Adding or updating tests                    |

Examples:

```
feat: add Kubernetes product tab
fix: handle empty RSS feed response in collect.js
chore: update Alpine.js to 3.14.8 with new SRI hash
docs: add deployment guide
sources: add AWS Security Blog feed
```

Keep the description lowercase, imperative mood, and under 72 characters.

---

## Pull Request Process

### Opening a PR

1. Create a branch from `main` using the naming convention above.
2. Make your changes and push to the remote.
3. Open a pull request targeting `main`.
4. Fill in the PR template with a summary of changes and a test plan.

### Automated Checks

The following checks run automatically on every PR:

- **Auto-labeling** -- PRs are labeled based on changed file paths (e.g., `sources`, `frontend`, `docs`, `ci`). This is configured in `.github/labeler.yml`.
- **Security pipeline** -- npm audit, ESLint security rules, gitleaks secrets scan, CodeQL SAST.
- **Dependency review** -- New dependencies are checked for known vulnerabilities and license compatibility.
- **Release drafter** -- Your PR is automatically categorized in the next draft release notes.

### Review Requirements

- At least **1 approval** is required before merging.
- All CI checks must pass.
- The branch must be up to date with `main`.

### Merging

- Use **squash and merge** for single-purpose PRs.
- Use **merge commit** for larger feature branches where individual commit history is valuable.
- Delete the branch after merging.

---

## Code Review Checklist

When reviewing a PR, check the following:

### General
- [ ] Changes match the PR description.
- [ ] No unrelated changes are included.
- [ ] Commit messages follow the format above.

### Frontend (HTML/CSS/JS)
- [ ] No hardcoded colors -- use CSS custom property tokens from `css/tokens.css`.
- [ ] New interactive elements have ARIA labels or roles.
- [ ] Tap targets are at least 44px.
- [ ] Dark mode works correctly (test by toggling the theme).
- [ ] No `!important` overrides unless absolutely necessary.

### Data Changes (sources, config)
- [ ] `data/sources.json` entries have all required fields (`id`, `name`, `type`, `url`, `tags`).
- [ ] `data/config.json` entries have valid `id`, `label`, and `tags`.
- [ ] Tag values match existing conventions (lowercase, hyphenated).
- [ ] The `total` count in `sources.json` is updated if sources were added or removed.

### Scripts (Node.js)
- [ ] No use of `eval()`, `new Function()`, or `child_process.exec()` with unsanitized input.
- [ ] Error handling is present for network requests and file operations.
- [ ] No secrets or API keys are hardcoded.

### CI/CD
- [ ] Workflow changes use pinned action versions (e.g., `@v4`, not `@main`).
- [ ] New permissions are minimal and justified.

---

## Testing Requirements

This project does not have a formal test suite. Before submitting a PR, verify your changes manually:

### For source changes
```bash
cd scripts
npm ci
node parse-sources.js
node collect.js
node build.js
```
Confirm that `data/news.json` is generated without errors and contains items from your new source.

### For frontend changes
1. Open `index.html` in a browser (or use a local server).
2. Verify the change works in both light and dark mode.
3. Test keyboard navigation (Tab, Enter, Escape).
4. Check the browser console for JavaScript errors.

### For CI changes
- Push to your branch and verify the workflow runs successfully in the Actions tab.

---

## Adding Sources, Products, and Topics

For detailed instructions on adding news sources, product tabs, sub-tabs, and sections, see [HOW_TO_ADD.md](../HOW_TO_ADD.md).

Quick summary:

| Task                         | File to Edit          | Helper Script             |
|------------------------------|-----------------------|---------------------------|
| Add a news source            | `data/sources.json`   | `scripts/add-source.sh`   |
| Add a product tab            | `data/config.json`    | `scripts/add-product.sh`  |
| Add a sub-tab                | `data/config.json`    | (manual edit)             |
| Add a new section            | Multiple files        | (manual edit)             |

---

## Questions

If something is unclear, open an issue with the `question` label or check the existing documentation:

- [HOW_TO_ADD.md](../HOW_TO_ADD.md) -- Adding sources and tabs
- [ARCHITECTURE.md](../ARCHITECTURE.md) -- System architecture
- [Documentation/DEPLOYMENT.md](DEPLOYMENT.md) -- Deployment process
- [RELEASE_STRATEGY.md](../RELEASE_STRATEGY.md) -- Versioning and releases
