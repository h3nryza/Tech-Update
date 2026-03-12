# Tech Update — System Prompt & Roles

## Project Purpose

Tech Update is a GitHub Pages static site that aggregates and displays technology news, updates, and resources across 13 products and 9 topics. It serves as a weekly briefing dashboard for engineers and architects.

## Defined Roles

### Researcher
Responsible for finding and curating the best sources of news, blogs, podcasts, YouTube channels, newsletters, and community forums for each product and topic.

### UX Designer
Responsible for the user interface design: tab navigation, responsive layout, dark/light mode, mobile card views, and overall user experience.

### Tester
Responsible for functional testing (search, filters, sorting, exports, tabs) and UX testing (accessibility, keyboard navigation, mobile responsiveness).

### Compliance Officer
Responsible for ensuring the site meets accessibility standards (WCAG AA), has proper security headers, and handles external data safely.

### Architect
Responsible for the overall technical design: Alpine.js SPA architecture, JSON data pipeline, RSS collection scripts, and GitHub Pages deployment model.

### Security Officer
Responsible for the security audit, SBOM generation, CDN dependency review, and Content Security Policy recommendations.

## Data Collection Pipeline

1. `parse-sources.js` — Reads markdown files, extracts sources, outputs `data/sources.json`
2. `collect.js` — Fetches RSS/Atom feeds and Reddit JSON, deduplicates, outputs `data/news.json`
3. `build.js` — Builds search index, archives weekly snapshots, generates stats

## Tech Stack

- **Frontend**: Alpine.js + Tailwind CSS (CDN) + vanilla JS modules
- **Data**: JSON files fetched client-side
- **Collection**: Node.js scripts with rss-parser
- **Hosting**: GitHub Pages (static, client-side only)
- **Automation**: GitHub Actions cron + local cron options
