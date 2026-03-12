# Immediate Next Steps

1. **Run first data collection** — Execute `cd scripts && node collect.js && node build.js` to populate real news data.

2. **Test the site locally** — Open `index.html` in a browser and verify all tabs, search, filters, and exports work.

3. **Enable GitHub Pages** — Go to repo Settings > Pages > Source: Deploy from branch `main`, root `/`.

4. **Generate npm lock file** — Run `cd scripts && npm install` to create `package-lock.json` for reproducible builds in CI.

5. **First GitHub Actions run** — Trigger the workflow manually to verify the CI pipeline works end-to-end.

6. **Review and expand RSS feeds** — Check which sources failed to fetch in `collect.js` output and add missing feed URLs.

7. **Mobile testing** — Test the site on actual mobile devices (iPhone, Android) for touch targets and readability.
