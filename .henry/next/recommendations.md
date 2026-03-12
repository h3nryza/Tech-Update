# Recommendations for Future Improvements

## High Priority

1. **Add more RSS feed mappings** — Currently 79 of 386 sources have RSS feeds. Research and add more feed URLs to `parse-sources.js`.

2. **AI-powered TLDR summaries** — Use an LLM API to generate better summaries for articles that only have short descriptions.

3. **Source health monitoring** — Track which feeds fail and alert when a source goes offline or stops publishing.

4. **Pagination** — As the data grows, implement virtual scrolling or pagination for the data table (currently renders all items).

## Medium Priority

5. **Saved filters/bookmarks** — Let users save and name filter combinations (e.g., "My Morning Briefing").

6. **Trending detection** — Identify stories appearing across multiple sources and flag them as trending.

7. **Reading list** — Allow users to mark items for later reading (localStorage-based).

8. **PWA support** — Add a service worker for offline access and installability.

9. **GitHub Pages custom domain** — Set up a custom domain for better branding.

## Low Priority

10. **Analytics** — Add privacy-respecting analytics (e.g., Plausible) to track which tabs/topics are most popular.

11. **Email digest** — GitHub Actions workflow that sends a weekly email summary.

12. **Slack integration** — Post daily summaries to a Slack channel.

13. **Source submission form** — Allow community contributions of new sources via GitHub Issues template.
