# Lessons Learned

## Data Collection

- **RSS availability varies widely**: Many official blogs have RSS feeds, but some (especially newer AI companies) don't publish standard RSS/Atom feeds.
- **YouTube RSS is reliable**: Public YouTube RSS feeds (`/feeds/videos.xml?channel_id=X`) work without API keys and are rate-limit friendly.
- **Reddit JSON endpoints work well**: Appending `.json` to subreddit URLs provides structured data without authentication, though rate limiting applies.
- **Deduplication is essential**: The same story appears across multiple sources. SHA-256 hashing of URLs provides reliable dedup.

## Architecture

- **Alpine.js is the right fit**: No build step, CDN-only, reactive enough for a data dashboard. Overkill frameworks would complicate GitHub Pages deployment.
- **Tailwind via CDN**: Works for prototyping and small sites. For production at scale, consider building with PostCSS.
- **JSON data files keep it simple**: No database, no API server, no auth. The tradeoff is that data updates require a pipeline run + git commit.

## Content Curation

- **Consolidated markdown tables are effective** for source tracking. They're human-readable, git-diffable, and parseable.
- **Coverage tags enable cross-cutting views**: A single source like "The New Stack" covers 6+ topics, and tagging makes this visible.
- **Popularity is subjective but useful**: "High" roughly means top-3 in its category or 100K+ audience. "Medium" means established but niche.

## UX

- **Mobile-first matters**: Most news consumption happens on phones. Card views work better than tables on small screens.
- **Tag-based search is intuitive**: Users expect `#security` to filter by security tags. Prefix matching enables this.
