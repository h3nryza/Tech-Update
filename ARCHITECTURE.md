# Tech Update -- Architecture

## System Overview

Tech Update is a **static GitHub Pages site** that aggregates tech news from RSS feeds, Atom feeds, and GitHub releases into a single searchable dashboard. It uses:

- **Alpine.js** for reactive UI (loaded from CDN)
- **Tailwind CSS** for styling (loaded from CDN)
- **No build step** -- the site is pure HTML + JS, served directly by GitHub Pages

All data collection happens server-side via Node.js scripts running in GitHub Actions. The browser simply fetches pre-built JSON files and renders them.

## Architecture Diagram

```
+---------------------------+       +----------------------------+
|   DATA SOURCES            |       |   GITHUB ACTIONS           |
|                           |       |   (Daily 04:00 UTC)        |
|  RSS / Atom Feeds  -------+------>|                            |
|  GitHub Releases   -------+------>|  1. parse-sources.js       |
|  YouTube Channels  -------+------>|  2. collect.js             |
|  Blogs / Newsletters      |       |  3. build.js               |
+---------------------------+       |  4. validate data          |
                                    |  5. git commit & push      |
                                    +-------------+--------------+
                                                  |
                                                  | pushes updated
                                                  | data/ files
                                                  v
+---------------------------+       +----------------------------+
|   BROWSER (Client)        |       |   GITHUB PAGES             |
|                           |       |                            |
|  Alpine.js app            |<------|  index.html                |
|   - Fetches config.json   |       |  js/  (app, tabs, search,  |
|   - Fetches news.json     |       |        export, theme)      |
|   - Fetches sources.json  |       |  data/ (news.json,         |
|   - Renders table UI      |       |         sources.json,      |
|   - Client-side search    |       |         config.json)       |
|   - Export (CSV/JSON/PDF) |       |  css/                      |
+---------------------------+       +----------------------------+
```

## Data Flow

```
sources.json --> collect.js (fetches RSS/Atom/GitHub) --> news.json --> browser renders
```

1. **sources.json** defines all feeds to monitor (434+ sources).
2. **collect.js** reads sources, fetches each RSS/Atom feed via `rss-parser`, extracts items, generates TLDRs, classifies tags, and writes **news.json**.
3. **build.js** creates a search index (**index.json**) and stats (**stats.json**).
4. The browser loads **config.json**, **news.json**, and **sources.json** at startup, then renders everything client-side with Alpine.js.

## Directory Structure

```
Tech-Update/
|-- index.html              Main (and only) HTML page
|-- js/
|   |-- app.js              Alpine.js component: state, filtering, sorting, exports
|   |-- tabs.js             Tab definitions, dynamic config loading, tag color map
|   |-- search.js           Simple search, advanced search (AND/OR), column filters
|   |-- export.js           CSV, JSON, and PDF export functions
|   |-- theme.js            Dark/light theme toggle, persisted to localStorage
|-- css/                    Custom styles (Tailwind handles most styling via CDN)
|-- data/
|   |-- config.json         UI configuration: products, topics, sub-tabs
|   |-- sources.json        All feed sources with metadata and tags
|   |-- news.json           Collected news items (the main dataset)
|   |-- index.json          Pre-built search index
|   |-- stats.json          Collection statistics
|   |-- archive/            Historical data snapshots
|-- scripts/
|   |-- collect.js          Main collection script (RSS/Atom/GitHub releases)
|   |-- parse-sources.js    Parses and normalises source definitions
|   |-- build.js            Builds search index and stats from news.json
|   |-- discover.js         Discovers new potential sources
|   |-- add-source.sh       Interactive script to add a new source
|   |-- add-product.sh      Interactive script to add a new product/topic
|   |-- cron-manager.sh     Local cron management (alternative to Actions)
|   |-- gen-sites-used.js   Generates the sites_used.csv / sites_used.md reports
|   |-- package.json        Node.js dependencies (rss-parser)
|-- .github/
|   |-- workflows/
|   |   |-- collect.yml         Daily collection pipeline (04:00 UTC / 06:00 SAST)
|   |   |-- pages.yml           Auto-deploy to GitHub Pages on push to main
|   |   |-- labeler.yml         Auto-labels PRs based on changed files
|   |   |-- release-drafter.yml Auto-drafts release notes from merged PRs
|   |-- labeler.yml             Labeler rules (file patterns -> labels)
|   |-- release-drafter.yml     Release drafter config (categories, version resolver)
|   |-- dependabot.yml          Weekly npm + GitHub Actions dependency updates
|-- products/               Static product-specific pages (legacy/supplementary)
|-- topics/                 Static topic-specific pages (legacy/supplementary)
|-- .security/              Security configuration and policies
|-- .henry/                 Personal configuration
|-- RELEASE_STRATEGY.md     Versioning, branching, and release process
```

## Repository Security & Governance

The following protections are enabled on the repository:

| Feature | Status |
|---------|--------|
| Branch protection on `main` | Enabled (1 approving review, dismiss stale reviews, no force push) |
| Dependabot security updates | Enabled |
| Dependabot alerts | Enabled |
| Secret scanning | Enabled |
| Secret scanning push protection | Enabled |
| PR auto-labeler | Enabled (labels by changed files) |
| Release drafter | Enabled (auto-drafts release notes) |

## Release Strategy

See [RELEASE_STRATEGY.md](RELEASE_STRATEGY.md) for full details. Summary:

- **SemVer**: `MAJOR.MINOR.PATCH`
- **Auto-labeling**: PRs labeled by file changes (`data`, `frontend`, `ci`, `docs`, `security`, `sources`, `config`)
- **Release drafter**: merges to `main` auto-draft release notes grouped by label
- **Version bumps**: `breaking` -> major, `feature`/`sources` -> minor, `fix`/`deps` -> patch
- **Branch naming**: `feature/*`, `fix/*`, `chore/*`, `docs/*`, `sources/*`

## Pipeline: How Data Collection Works

The GitHub Actions workflow (`.github/workflows/collect.yml`) runs **daily at 04:00 UTC (06:00 SAST)** and can also be triggered manually via `workflow_dispatch`.

### Steps

1. **Checkout** the repository.
2. **Install Node.js 20** and npm dependencies (`scripts/package.json` -- currently just `rss-parser`).
3. **Run `parse-sources.js`** -- normalises and validates `data/sources.json`.
4. **Run `collect.js`** -- fetches all RSS/Atom feeds, extracts items, generates TLDRs, classifies tags, writes `data/news.json`.
5. **Run `build.js`** -- builds the search index (`data/index.json`) and stats (`data/stats.json`).
6. **Validate data** -- checks all news items have required fields (`id`, `title`, `url`).
7. **Commit and push** -- if there are changes in `data/`, commits them with the message `chore: daily news collection YYYY-MM-DD`.

The push to `main` then triggers the **pages deployment workflow** (`.github/workflows/pages.yml`), which runs a secrets scan and deploys the entire repo to GitHub Pages.

## How config.json Drives the UI

`data/config.json` is the single source of truth for what tabs appear in the sidebar. It has three top-level keys:

### products

An array of product definitions. Each product becomes a tab in the "Products" section of the sidebar.

```json
{ "id": "aws", "label": "AWS", "icon": "...", "tags": ["aws"] }
```

Products can have **children** (sub-tabs) for more granular filtering:

```json
{
  "id": "terraform", "label": "Terraform", "icon": "...", "tags": ["terraform"],
  "children": [
    {
      "id": "tf-aws-provider", "label": "AWS Provider", "icon": "...",
      "tags": ["terraform", "aws"],
      "filter_source": "Terraform AWS Provider"
    }
  ]
}
```

The `filter_source` field on children enables precise filtering -- items must match BOTH the tags AND have a `source_name` containing the `filter_source` string.

### topics

An array of topic definitions. Each topic becomes a tab in the "Topics" section of the sidebar.

```json
{ "id": "sre", "label": "SRE", "icon": "...", "tags": ["sre"] }
```

### software

An array of software/language/runtime definitions. Each entry becomes a tab in the "Software" section.

```json
{ "id": "java", "label": "Java / JDK", "icon": "...", "tags": ["java"] }
```

Current software tabs: Java, Python, Rust, Go, Node.js, TypeScript, .NET, Docker, Kubernetes, Maven, Gradle.

### How tabs.js loads config

`js/tabs.js` contains `loadTabConfig()` which:
1. Fetches `data/config.json`.
2. Iterates over `products`, `topics`, and `software`.
3. Maps each entry into a flat tab array with a `group` field (`'products'`, `'topics'`, or `'software'`).
4. Children are added both nested (for sidebar display) and as standalone tabs (for filtering).
5. Falls back to hardcoded `DEFAULT_TABS` if the fetch fails.

## Data Schemas

### news.json item

Each item in `news.json` has these fields:

| Field         | Type       | Description                                           |
|---------------|------------|-------------------------------------------------------|
| `id`          | string     | SHA-256 hash (first 16 chars) of the item URL         |
| `title`       | string     | Article/post title                                    |
| `url`         | string     | Link to the original content                          |
| `source`      | string     | ID of the source (matches `sources.json` entry)       |
| `source_name` | string     | Human-readable source name                            |
| `published`   | string     | ISO 8601 date string                                  |
| `tldr`        | string     | Auto-generated summary (up to 800 chars; up to 1200 chars for GitHub releases with changelog details) |
| `version`     | string/null| Extracted version string (e.g., "1.14.7") or null     |
| `tags`        | string[]   | Array of tags: product/topic IDs + `#type` tags       |
| `type`        | string     | Content type: article, video, podcast, etc.           |
| `views`       | number/null| View count (YouTube) or null                          |

Tags fall into two categories:
- **Product/topic tags**: `aws`, `terraform`, `sre`, etc. -- used for tab filtering.
- **Content tags** (prefixed with `#`): `#article`, `#video`, `#release`, `#security`, `#breaking-change`, `#zero-day`, `#tutorial`, `#new`, `#update`, `#podcast`, `#social`.
- **Stability tags**: `#stable`, `#beta`, `#alpha` — auto-classified from version strings on release items.

### sources.json source

Each source in `sources.json` has these fields:

| Field        | Type       | Description                                          |
|--------------|------------|------------------------------------------------------|
| `id`         | string     | SHA-256 hash (first 12 chars) of the source URL      |
| `name`       | string     | Human-readable source name                           |
| `type`       | string     | Source type: blog, youtube, podcast, newsletter, forum|
| `url`        | string     | Website URL                                          |
| `rss_url`    | string/null| RSS/Atom feed URL (null if not available)            |
| `frequency`  | string     | Posting frequency (e.g., "3-5", "varies")            |
| `popularity` | string     | high, medium, or low                                 |
| `tags`       | string[]   | Product/topic tags this source maps to               |

## CDN Dependencies

The site loads all libraries from CDN -- no local bundling or build step required:

| Library               | CDN                              | Purpose                         |
|-----------------------|----------------------------------|---------------------------------|
| **Tailwind CSS**      | cdn.tailwindcss.com              | Utility-first CSS framework     |
| **Alpine.js**         | CDN (loaded in index.html)       | Reactive UI framework           |
| **jsPDF 2.5.2**       | cdnjs.cloudflare.com             | PDF generation                  |
| **jsPDF-AutoTable 3.8.4** | cdnjs.cloudflare.com         | PDF table formatting            |

## Search Architecture

Search is entirely client-side, implemented in `js/search.js`.

### Simple Search

All space-separated terms must match (implicit AND). Terms are matched against a cached searchable string built from the item's title, TLDR, source name, tags, and date.

Hash-prefixed terms (e.g., `#security`) are matched exactly against the item's tags array.

### Advanced Search (Builder UI)

Users can build structured queries with:
- **Field**: any, title, TLDR, source, tag, date
- **Operator**: contains, equals, starts_with, ends_with, regex, not_contains
- **Negate**: invert the condition
- **Logic**: combine conditions with AND or OR

### Column Filters

Per-column include/exclude filters with the same operator set. Users can stack multiple column filters, each targeting a specific column (title, source, tags, date).

### Date Filtering

- Presets: today, yesterday, this week, last week, last 30 days, last 90 days
- Custom: manual start/end date pickers

## Export Capabilities

Implemented in `js/export.js`. All exports operate on the **currently filtered** items.

| Format | Details                                                          |
|--------|------------------------------------------------------------------|
| **CSV**  | Headers: Date, Title, Source, URL, TLDR, Tags, Type, Views    |
| **JSON** | Full item data with export timestamp and count                 |
| **PDF**  | Landscape PDF using jsPDF + AutoTable with styled headers      |

Exports trigger a browser download via a dynamically created Blob URL.
