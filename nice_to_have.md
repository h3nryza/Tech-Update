# Nice to Have

Features and improvements that are not critical but would be good to add later.

## SRI Integrity Hashes for CDN Scripts
Add `integrity="sha384-..."` attributes to external CDN script tags for subresource integrity protection. Affected scripts:
- `jspdf/2.5.2/jspdf.umd.min.js` (cdnjs)
- `jspdf-autotable/3.8.4/jspdf.plugin.autotable.min.js` (cdnjs)
- `@alpinejs/collapse@3.14.8/dist/cdn.min.js` (jsdelivr)
- `alpinejs@3.14.8/dist/cdn.min.js` (jsdelivr)

**Why nice-to-have:** The site is static on GitHub Pages with a CSP already restricting script sources to trusted CDNs. SRI adds tamper detection but is low risk given the hosting model.
