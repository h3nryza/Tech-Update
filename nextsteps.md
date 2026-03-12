# Next Steps

## Immediate (This Week)

1. **Verify all feeds are collecting** — Run `cd scripts && node collect.js` and check each product has items
2. **Review TLDR quality** — Spot-check 10-20 items across different sources for meaningful summaries
3. **Test the site** — Visit https://h3nryza.github.io/Tech-Update/ and verify:
   - All sidebar sections expand/collapse (Products, Topics, Software)
   - Terraform and AWS sub-tabs show filtered items
   - Version column shows versions for release items
   - Tag pills are clickable and filter correctly
   - Advanced search with operators works
   - Column resize works with visible line
   - Frozen headers stay when scrolling
   - Mobile view is usable
   - Dark mode works

## Short Term (Next 2 Weeks)

4. **Add missing RSS feeds** — Many sources don't have RSS. Priority:
   - Claude Changelog (currently no RSS — check if Anthropic adds one)
   - OpenAI Changelog
   - Notion What's New
   - Gemini Release Notes (no RSS confirmed)
   - Consider building a simple scraper for these

5. **Expand Software section** — Consider adding:
   - Spring Boot releases
   - Angular / React / Vue releases
   - Terraform modules (popular ones)
   - Helm chart releases

6. **Set up Slack notifications** — Create a webhook to post daily digest

## Medium Term (Next Month)

7. **AI integration** — Use Claude API to:
   - Generate weekly summary emails
   - Auto-tag items that the regex misses
   - Suggest new sources based on gaps

8. **User preferences** — localStorage-based:
   - Favourite tabs (show first)
   - Hidden tabs (don't show)
   - Default date range
   - Column visibility preferences

9. **Performance** — If news.json grows large:
   - Split by month/week
   - Lazy load older items
   - Client-side pagination

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
