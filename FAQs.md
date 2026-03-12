# Frequently Asked Questions

## General

**Q: What is Tech Update?**
A: A static dashboard that aggregates tech news across 13 products and 9 topics from 386+ curated sources. It runs on GitHub Pages with no backend.

**Q: How often is data updated?**
A: Daily at 8:00 AM SAST (06:00 UTC) via GitHub Actions. You can also run collection manually.

**Q: Can I use this for my own topics?**
A: Yes. Add a new directory under `products/` or `topics/`, create a `claude.md` with sources, update `consolidated.md`, and run `parse-sources.js`.

## Data

**Q: Where does the news data come from?**
A: RSS/Atom feeds from blogs, YouTube channels, and Reddit subreddits. See `sites_used.md` for the complete list.

**Q: How far back does the data go?**
A: 365 days rolling. Items older than a year are pruned during each build. Weekly snapshots are archived in `data/archive/`.

**Q: Why are some tabs empty?**
A: If collection hasn't run yet or if no items matched that tab's tags. Run `cd scripts && node collect.js && node build.js` to populate data.

## Features

**Q: How does search work?**
A: Type words to search titles, TLDRs, and source names. Prefix with `#` to search tags (e.g., `#security`, `#video`). Toggle "GLOBAL" to search across all tabs.

**Q: Can I export data?**
A: Yes. Use the CSV, JSON, or PDF export buttons in the footer. Exports include only the currently filtered/visible items.

**Q: Does it work offline?**
A: Partially. The HTML, CSS, and JS load from CDN so they need internet. Once loaded, the cached data works offline. Full PWA support is planned.

## Technical

**Q: Why Alpine.js instead of React/Vue?**
A: GitHub Pages is static hosting. Alpine.js works via CDN with no build step, keeping deployment simple.

**Q: How do I add a new RSS feed?**
A: Edit `scripts/parse-sources.js` and add the feed URL to the `RSS_FEEDS` map. For YouTube, add the channel ID to `YOUTUBE_CHANNEL_IDS`.

**Q: Can I self-host this?**
A: Yes. It's a static site — any web server that serves HTML files will work (nginx, Apache, Netlify, Vercel, etc.).
