# Next Steps

## Completed

- [x] All feeds collecting (434 sources, 126 with active RSS)
- [x] TLDR quality improved (800 chars standard, 1200 chars for GitHub releases)
- [x] Software section added (Java, Python, Rust, Go, Node.js, TypeScript, .NET, Docker, K8s, Maven, Gradle)
- [x] Spring Boot, React, Angular, Vue, Helm release feeds added
- [x] Share button panel (Copy link, Email, Teams, Slack, X, LinkedIn, Reddit, WhatsApp, Telegram)
- [x] Version column with #alpha/#beta/#stable tags
- [x] Advanced search with AND/OR logic and 6 operators
- [x] PR labeler, release drafter, and release strategy (v1.0.0 tagged)
- [x] Branch protection, Dependabot, secret scanning enabled
- [x] Dark mode, mobile responsive, frozen headers, column resize

## Immediate (This Week)

1. **Test the live site end-to-end** — Visit https://h3nryza.github.io/Tech-Update/ and verify:
   - All 3 sidebar sections (Products, Topics, Software) expand/collapse
   - Share buttons work on desktop and mobile
   - Terraform and AWS sub-tabs show filtered items
   - Version column shows versions for release items
   - Tag pills are clickable and filter correctly
   - Export CSV/JSON/PDF works
   - Dark mode works across all views

2. **Merge pending Dependabot PRs** — Review and merge weekly dependency updates

3. **Monitor first automated cron run** — Check GitHub Actions at 06:00 SAST, verify data committed and site updated

## Short Term (Next 2 Weeks)

4. **Add missing RSS feeds** — Many sources don't have RSS. Priority:
   - Claude Changelog (currently no RSS — check if Anthropic adds one)
   - OpenAI Changelog
   - Notion What's New
   - Gemini Release Notes (no RSS confirmed)
   - Consider building a simple scraper for these

5. **Set up Slack notifications** — Create a webhook to post daily digest of #breaking-change, #security, #zero-day items

6. **AI-powered weekly digest** — Use Claude API to generate a summary email per product/topic

## Medium Term (Next Month)

7. **User preferences** — localStorage-based:
   - Favourite tabs (show first)
   - Hidden tabs (don't show)
   - Default date range
   - Column visibility preferences

8. **Performance** — If news.json grows large:
   - Split by month/week
   - Lazy load older items
   - Client-side pagination

9. **Version diff tracking** — Show "v1.14.6 → v1.14.7" with changelog diff

10. **PWA / Offline Support** — Service worker for offline access, add-to-homescreen

## Long Term (Commercialisation)

11. **See [COMMERCIAL.md](COMMERCIAL.md)** for the full product strategy, pricing, and monetisation plan using Yoco for South African billing

## How to Add Things

See [HOW_TO_ADD.md](HOW_TO_ADD.md) for detailed instructions.

Quick reference:
```bash
# Add a new source
./scripts/add-source.sh

# Add a new product/topic
./scripts/add-product.sh

# Find new sources to add
node scripts/discover.js prompt

# Check coverage gaps
node scripts/discover.js gaps

# Run collection manually
cd scripts && node collect.js && node build.js
```
