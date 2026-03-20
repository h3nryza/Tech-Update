# Memory - Context Loading Reference

Quick-load context for future sessions on Tech Update.

## Architecture
- **Stack:** Alpine.js 3.14.8 + Tailwind CSS (CDN) + jsPDF. Static site on GitHub Pages.
- **Entry point:** `index.html` (single-page app, ~780 lines)
- **JS modules:** `js/app.js` (Alpine component), `js/tabs.js` (tab config + TAG_COLORS), `js/search.js` (search/filter/sort), `js/export.js` (CSV/JSON/PDF), `js/theme.js` (dark/light toggle)
- **CSS:** `css/tokens.css` (356 design tokens, 3-tier system), `css/style.css` (component styles)
- **Data:** `data/news.json` (1551 items), `data/config.json` (33 tabs across products/topics/software), `data/sources.json` (440 RSS sources), `data/stats.json`, `data/index.json` (search index)
- **Pipeline:** `scripts/collect.js` (daily RSS collection via GitHub Actions at 04:00 UTC), `scripts/build.js` (search index + stats + archive)

## Key Data Flow
1. `collect.js` fetches RSS feeds -> deduplicates -> merges into `news.json`
2. `build.js` creates search index, stats, weekly archive snapshots
3. `index.html` loads `config.json` to build tab definitions, then fetches `news.json` for display
4. Alpine.js `app()` component manages state: tab selection, search, filters, sorting, export, share

## Default Landing
- Default tab: `aws` (200 items as of 2026-03-20)
- Items are deduplicated by URL hash (SHA256, first 16 hex chars)
- Tags are hierarchical: category tags (`aws`, `terraform`) + hash tags (`#new`, `#update`, `#security`)

## Known Patterns
- Tab children use `filter_source` to narrow by `source_name` within parent tags
- `x-for` templates use composite keys (`item.id + '-' + idx`) for safety against duplicate IDs
- CSP restricts to self + 3 CDNs (Tailwind, jsDelivr, cdnflare)
- Dark mode via `.dark` class on `<html>`, toggled by `js/theme.js`

## Recent Fix (2026-03-20)
- Removed 136 duplicate items from news.json (same URL from multiple RSS sources)
- Fixed collect.js batch-level dedup (was only deduping against existing data, not within current run)
- All `x-for` directives now have `:key` attributes with composite keys

## Tab Groups
- **Products (13):** AWS (6 sub-tabs), Azure, Terraform (4 sub-tabs), Cloudflare, Datadog, Claude, Gemini, OpenAI, GitHub Copilot, Slack, Obsidian, Notion, VS Code
- **Topics (9):** SRE, Platform Eng, DevOps, SecOps, Software Eng, Automation, Orchestration, Cloud Arch, Software Arch
- **Software (11):** Java, Python, Rust, Go, Node.js, TypeScript, .NET, Docker, Kubernetes, Maven, Gradle
