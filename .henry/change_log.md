# Change Log

## 2026-03-12 — Initial Build

### Research Phase
- Researched and documented 386 unique sources across 13 products and 9 topics
- Created individual `claude.md` files for each product/topic directory
- Created `consolidated.md` files with deduplicated, ranked source lists

### Data Pipeline
- Built `scripts/parse-sources.js` to extract sources from markdown into JSON
- Built `scripts/collect.js` with RSS/Atom/Reddit feed fetching
- Built `scripts/build.js` for search indexing and weekly archiving
- Generated initial `data/sources.json` with 386 sources (79 with RSS feeds)

### Frontend
- Created `index.html` SPA shell with Alpine.js + Tailwind CSS
- 22-tab navigation (13 products + 9 topics) with horizontal scroll
- Sortable data table with Date, Title, Source, TLDR, Tags, Views columns
- Mobile card view for responsive design
- Colour-coded tag pills with emoji indicators
- Per-tab and global search with debounced input
- Date filtering (presets + custom range)
- CSV, JSON, and PDF export
- Dark/light mode with system preference detection

### Automation
- GitHub Actions workflow for daily collection at 8am SAST
- macOS launchctl, Linux crontab, and Windows Task Scheduler instructions

### Documentation
- Created full documentation suite in `.henry/` directory
- Security audit report, SBOM, and dashboard in `.security/`
- FAQs, README.html, UPDATING.md, sites_used.md, sites_used.csv

### Cleanup
- Removed empty `/AWS/` directory at root
- Consolidated `/products/open-ai/` into `/products/OpenAI/`
