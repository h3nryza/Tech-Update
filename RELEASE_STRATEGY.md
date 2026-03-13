# Release Strategy

## Versioning

This project follows **Semantic Versioning** (SemVer): `MAJOR.MINOR.PATCH`

| Bump | When | Examples |
|------|------|----------|
| **MAJOR** (2.0.0) | Breaking changes to config format, data schema, or removal of features | Changing `config.json` structure, removing export formats, changing `news.json` schema |
| **MINOR** (1.1.0) | New features, new sources, new tabs/sections | Adding a product, new search operators, new export format, bulk source additions |
| **PATCH** (1.0.1) | Bug fixes, dependency updates, doc fixes, CI tweaks | Fixing broken RSS feed, updating npm packages, typo fixes |

## Workflow

### 1. Branch & PR

All changes go through pull requests:

```
main (protected)
  └── feature/add-spring-boot-tab
  └── fix/terraform-tldr-empty
  └── chore/update-dependencies
```

**Branch naming:**
- `feature/*` — new functionality
- `fix/*` — bug fixes
- `chore/*` — maintenance, deps, CI
- `docs/*` — documentation only
- `sources/*` — adding/updating sources

### 2. Auto-Labeling

PRs are automatically labeled based on changed files:

| Label | Triggered by |
|-------|-------------|
| `data` | Changes to `scripts/**`, `data/sources.json`, `data/config.json` |
| `frontend` | Changes to `index.html`, `js/**`, `css/**` |
| `ci` | Changes to `.github/**` |
| `docs` | Changes to `*.md` |
| `security` | Changes to `.security/**`, `.github/dependabot.yml` |
| `sources` | Changes to `data/sources.json`, `products/**`, `topics/**` |
| `config` | Changes to `data/config.json`, `scripts/package.json` |

You can also manually add: `feature`, `fix`, `breaking`, `minor`, `patch`

### 3. Release Drafting

Every push to `main` updates a **draft release** automatically:
- Groups PRs by label into categories (Sources, Frontend, Bug Fixes, etc.)
- Auto-resolves the next version based on PR labels:
  - Any `breaking` label → **major** bump
  - Any `feature`/`enhancement`/`sources` label → **minor** bump
  - Everything else → **patch** bump

### 4. Publishing a Release

When ready to release:

1. Go to [Releases](https://github.com/h3nryza/Tech-Update/releases)
2. Find the draft release
3. Review the auto-generated notes
4. Edit the version tag if needed
5. Click **Publish release**

Or via CLI:
```bash
# Tag and release
git tag -a v1.1.0 -m "v1.1.0 - Description"
git push origin v1.1.0
gh release create v1.1.0 --generate-notes
```

## Release Cadence

| Type | Frequency | Trigger |
|------|-----------|---------|
| **Patch** | As needed | Bug fixes, dependency updates |
| **Minor** | Bi-weekly or when meaningful features land | New sources, UI improvements |
| **Major** | Rare | Breaking schema/config changes |

## Automated Updates (No Release Needed)

These happen daily without a release:
- **News collection** — 06:00 SAST via GitHub Actions cron
- **Dependabot PRs** — weekly dependency updates (auto-labeled `dependencies`)

## Labels Reference

| Label | Color | Version Bump |
|-------|-------|-------------|
| `breaking` | Red | Major |
| `feature` | Teal | Minor |
| `sources` | Green | Minor |
| `fix` | Red | Patch |
| `dependencies` | - | Patch |
| `docs` | Blue | Patch |
| `ci` | - | Patch |
| `data` | Blue | - |
| `frontend` | Teal | - |
| `security` | Red | - |
| `config` | Purple | - |
