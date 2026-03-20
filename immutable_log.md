# Immutable Change Log - 2026-03-20

All changes made during the QA audit session. Each entry is final and cannot be retroactively modified.

---

## Change 1: Deduplicate news.json
- **File:** `data/news.json`
- **Before:** 1687 items with 136 duplicate entries (106 unique IDs appearing 2-3 times each)
- **After:** 1551 unique items, 0 duplicates
- **Root cause:** Same article URLs syndicated across multiple RSS sources (e.g., GitHub Blog + GitHub Changelog + GitHub Blog - Copilot) produced identical ID hashes but were stored as separate entries
- **Impact:** Alpine.js `x-for :key` relies on unique keys. Duplicate IDs caused DOM rendering corruption, preventing items from displaying correctly - particularly visible on the AWS tab (200 items, default landing page)

## Change 2: Fix collect.js within-batch deduplication
- **File:** `scripts/collect.js` (lines 330-344)
- **Before:** `existingIds` Set only tracked IDs from the previous news.json. Items fetched from multiple sources in the same collection run could produce duplicates
- **After:** Added `seenIds` Set that tracks IDs from existing data AND from all sources processed in the current batch. Each new item's ID is added to `seenIds` immediately after acceptance
- **Impact:** Prevents future duplicate accumulation during daily collection runs

## Change 3: Fix Alpine.js x-for keys in index.html
- **File:** `index.html`
- **Changes:**
  - Line 527: `:key="item.id"` changed to `:key="item.id + '-' + idx"` (desktop table template)
  - Line 610: `:key="item.id"` changed to `:key="item.id + '-m-' + idx"` (mobile card template)
  - Line 128: Added `:key="p.id"` to date preset buttons template (was missing entirely)
- **Impact:** Even if duplicate IDs somehow enter the data again, the frontend will render correctly using composite keys

---

## Summary
| Metric | Before | After |
|--------|--------|-------|
| Total items | 1687 | 1551 |
| Duplicate entries | 136 | 0 |
| x-for without :key | 1 | 0 |
| JS syntax errors | 0 | 0 |
| AWS tab items | 200 | 200 |
| All 10 QA passes | N/A | PASS |
