# Engineering Standards

> Comprehensive standards derived from auditing a static site (Alpine.js + Tailwind CSS + GitHub Pages) tech news aggregator. These standards apply to all current and future projects.

---

## Table of Contents

1. [Security Pipeline Standards](#1-security-pipeline-standards)
2. [UX/Placement Standards](#2-uxplacement-standards)
3. [White-Label CSS Standards](#3-white-label-css-standards)
4. [Usability Testing Standards](#4-usability-testing-standards)
5. [Code Quality Standards](#5-code-quality-standards)
6. [Documentation Standards](#6-documentation-standards)

---

## 1. Security Pipeline Standards

### CI/CD Pipeline Stages

Every push and pull request must pass through these stages in order:

| Stage | Tool | Purpose |
|---|---|---|
| Lint | ESLint / Stylelint | Catch syntax errors and enforce style |
| Test | Jest / Vitest | Unit and integration tests |
| SAST | CodeQL | Static Application Security Testing -- find vulnerabilities in source code |
| SCA | `npm audit` | Software Composition Analysis -- find known vulnerabilities in dependencies |
| Secrets Scanning | gitleaks | Detect committed secrets, tokens, and API keys |
| Dependency Review | GitHub Dependency Review Action | Block PRs that introduce vulnerable dependencies |
| License Compliance | license-checker or similar | Ensure all dependencies use approved licenses |
| SBOM Generation | `@cyclonedx/cyclonedx-npm` or similar | Produce a Software Bill of Materials for each release |

### Pipeline Configuration Requirements

- **SAST (CodeQL):** Run on every PR and on a weekly schedule against the default branch. Use the `security-extended` query suite.
- **SCA (npm audit):** Run with `--audit-level=high`. The build must fail on high or critical severity findings.
- **Secrets Scanning (gitleaks):** Must fail the build on any finding. No exceptions. Configure a `.gitleaks.toml` allowlist only for known false positives with documented justification.
- **Dependency Review:** Block merging when a PR introduces any dependency with a known high or critical vulnerability.
- **License Compliance:** Maintain an explicit allowlist of approved licenses (MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC). Flag anything else for manual review.
- **SBOM Generation:** Generate on every release tag. Store the SBOM artifact alongside the release.

### CDN and Subresource Integrity

All scripts and stylesheets loaded from external CDNs must include SRI hashes:

```html
<!-- WRONG: no integrity attribute -->
<script src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>

<!-- CORRECT: SRI hash present -->
<script
  src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"
  integrity="sha384-<hash>"
  crossorigin="anonymous"
></script>
```

Generate hashes with:

```bash
curl -s https://cdn.example.com/lib.min.js | openssl dgst -sha384 -binary | openssl base64 -A
```

### Content Security Policy

Include a CSP meta tag in the HTML `<head>` to restrict resource origins:

```html
<meta http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' https: data:; connect-src 'self' https://api.example.com;">
```

Tighten the policy over time. Avoid `'unsafe-eval'` entirely. Minimize use of `'unsafe-inline'` for styles and eliminate it for scripts wherever possible.

### Branch Protection Rules

The default branch (`main`) must have these protections enabled:

- Require pull requests before merging (no direct pushes).
- Require at least 1 approving review.
- Require all status checks to pass before merging (lint, test, SAST, SCA, secrets scan).
- Require branches to be up to date before merging.
- Require signed commits (recommended, not mandatory for open source).
- Do not allow force pushes.
- Do not allow deletions.

### Dependabot Configuration

Place `.github/dependabot.yml` in the repository:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 10
    labels:
      - "dependencies"
    # Security updates are always immediate (Dependabot default behavior)

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    labels:
      - "ci"
```

Security updates are delivered immediately by default; this configuration handles version updates on a weekly cadence.

### GitHub Advanced Security (GHAS) Policy

- **Public repositories:** Enable GHAS features (CodeQL, secret scanning, dependency review). These are free for public repos.
- **Private repositories:** Do NOT enable GHAS unless there is an explicit budget allocation. GHAS on private repos incurs per-committer licensing costs. Use free alternatives (npm audit, gitleaks CLI, open-source SAST) for private repos instead.

### Common Findings and Fixes -- Security

| Finding | Fix |
|---|---|
| CDN `<script>` or `<link>` tags without `integrity` attribute | Add SRI hash and `crossorigin="anonymous"` |
| No CSP meta tag | Add a restrictive CSP meta tag to `<head>` |
| `npm audit` reports high/critical vulnerabilities | Run `npm audit fix` or pin to a patched version; if no fix exists, document the risk and set a review date |
| Secrets (API keys, tokens) committed to repo | Rotate the secret immediately, add pattern to `.gitleaks.toml`, add to `.gitignore` |
| GitHub Actions using mutable tags (`@v3`) | Pin to full SHA: `uses: actions/checkout@<full-sha>` |
| No branch protection on `main` | Enable all rules listed above via repository Settings > Branches |
| GHAS enabled on private repo without budget approval | Disable GHAS; switch to free tooling |

---

## 2. UX/Placement Standards

### Responsive Design Breakpoints

Design and test at these breakpoints using a mobile-first approach (min-width media queries):

| Breakpoint | Device Category | Min Width |
|---|---|---|
| XS | Small phones | 320px |
| SM | Standard phones | 375px |
| MD | Large phones | 414px |
| LG | Tablets | 768px |
| XL | Small laptops | 1024px |
| 2XL | Desktops | 1280px |
| 3XL | Large desktops | 1440px+ |

Base styles target the smallest screen. Each breakpoint adds or overrides layout for larger screens. Never hide critical functionality behind a breakpoint -- all features must be accessible at every size.

### Touch Targets

- Minimum tap target size: **44x44px** (per WCAG 2.5.8 and Apple HIG).
- Minimum gap between adjacent tap targets: **8px**.
- Inline text links in body copy are exempt from the 44px rule but should still have generous padding when possible.

```css
/* Example: ensuring a button meets minimum tap target */
.btn {
  min-height: 44px;
  min-width: 44px;
  padding: 12px 24px;
}

/* Example: gap between adjacent targets */
.btn + .btn {
  margin-left: 8px;
}
```

### Button and Action Placement

- **Primary actions** must be visually dominant: larger size, higher contrast, bolder weight.
- **Destructive actions** (delete, remove, reset) must use a red/danger color and require a confirmation step (modal or inline confirm).
- Button labels must be **action verbs** that describe what happens: "Save Changes", "Delete Item", "Send Invite". Never use "Submit", "OK", or "Click Here".
- Minimum button padding: **12px vertical, 24px horizontal**.
- On mobile, primary actions should be within thumb reach (bottom half of screen when possible).

### Navigation

- Any destination must be reachable within **3 taps** from the home screen.
- The user's **current location** must always be visually indicated (active nav item, breadcrumb, highlighted tab).
- Use a consistent navigation pattern across all pages (e.g., bottom tab bar on mobile, sidebar or top nav on desktop).
- Back navigation must always be available and predictable.

### Search

- **Search must be available on any page with scrollable content.** If a page has more content than fits in the viewport, provide a search or filter mechanism.
- Search should be accessible from a persistent UI element (header bar, floating action button, or inline filter).
- Provide clear feedback when search returns no results, including suggestions or a "clear filters" action.

### Forms

- **Labels above inputs** (not inline placeholders as the only label).
- Use correct `type` attributes: `email`, `tel`, `url`, `number`, `date`, `password`, `search`.
- **Inline validation:** Validate on blur (not on every keystroke). Show errors adjacent to the field, not in a summary at the top.
- Add `autocomplete` attributes for common fields: `name`, `email`, `tel`, `street-address`, `postal-code`, `cc-number`, etc.
- Group related fields visually. Use `<fieldset>` and `<legend>` for related groups.
- Mark required fields explicitly. Use `aria-required="true"` in addition to a visual indicator.

### Loading and Layout Stability

- Use **skeleton screens** for asynchronous content (not spinners). Skeleton shapes should match the layout of the content they replace.
- Apply **optimistic UI** where safe: when the user performs an action with a high success rate (toggling a setting, marking as read), update the UI immediately and reconcile on server response.
- **Cumulative Layout Shift (CLS) must be below 0.1.** Achieve this by:
  - Setting explicit `width` and `height` on images and videos.
  - Reserving space for dynamic content (ads, embeds, async-loaded sections).
  - Never inserting content above the user's current scroll position.

### Accessibility (WCAG 2.1 AA)

| Requirement | Implementation |
|---|---|
| Color contrast (normal text) | Minimum 4.5:1 ratio |
| Color contrast (large text, 18px+ or 14px+ bold) | Minimum 3:1 ratio |
| Skip-to-content link | First focusable element in the DOM: `<a href="#main-content" class="sr-only focus:not-sr-only">Skip to content</a>` |
| Icon-only buttons | Must have `aria-label` describing the action |
| Focus indicators | Visible focus ring on all interactive elements; never `outline: none` without a replacement |
| Keyboard navigation | All interactive elements reachable and operable via Tab, Enter, Space, Escape, Arrow keys as appropriate |
| Reduced motion | Wrap animations in `@media (prefers-reduced-motion: no-preference) { }` |
| Dynamic content announcements | Use `aria-live="polite"` for non-urgent updates; `aria-live="assertive"` for errors |
| Heading hierarchy | One `<h1>` per page; no skipped levels (h1 > h2 > h3) |
| Alt text for images | Descriptive for informational images; `alt=""` for decorative images |

```css
/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### Common Findings and Fixes -- UX

| Finding | Fix |
|---|---|
| Tap targets smaller than 44x44px | Increase `min-height` and `min-width` or add padding |
| Adjacent buttons with no gap | Add `margin` or `gap` of at least 8px |
| Placeholder text used as label | Add a visible `<label>` element above the input |
| No loading indicator for async content | Add skeleton screens matching the expected layout |
| Layout shifts when images load | Add explicit `width` and `height` attributes to `<img>` tags |
| No focus indicator on interactive elements | Add `:focus-visible` styles; never remove `outline` without a replacement |
| Missing `aria-label` on icon buttons | Add `aria-label="Description of action"` |
| No skip-to-content link | Add as the first element inside `<body>` |
| Animations play for users who prefer reduced motion | Wrap in `@media (prefers-reduced-motion: no-preference)` |
| Search unavailable on long scrollable pages | Add a persistent search input or filter control |

---

## 3. White-Label CSS Standards

### 3-Tier Token System

All visual properties must be defined through a three-tier custom property system:

#### Tier 1: Primitives

Raw values. These are the palette. Customers do not override these directly.

```css
:root {
  /* Color primitives */
  --color-blue-50: #eff6ff;
  --color-blue-100: #dbeafe;
  --color-blue-500: #3b82f6;
  --color-blue-600: #2563eb;
  --color-blue-700: #1d4ed8;
  --color-blue-900: #1e3a5f;

  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-500: #6b7280;
  --color-gray-700: #374151;
  --color-gray-800: #1f2937;
  --color-gray-900: #111827;

  --color-red-500: #ef4444;
  --color-red-600: #dc2626;

  --color-green-500: #22c55e;
  --color-green-600: #16a34a;

  --color-white: #ffffff;
  --color-black: #000000;

  /* Spacing primitives */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;

  /* Typography primitives */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'Fira Code', ui-monospace, monospace;

  /* Radius primitives */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;
}
```

#### Tier 2: Semantic Tokens

These map primitives to purpose. **This is the tier customers override.** Components must reference ONLY Tier 2 tokens.

```css
:root {
  /* Brand */
  --brand-primary: var(--color-blue-600);
  --brand-primary-hover: var(--color-blue-700);
  --brand-secondary: var(--color-gray-700);

  /* Surfaces */
  --surface-page: var(--color-white);
  --surface-card: var(--color-white);
  --surface-elevated: var(--color-white);
  --surface-overlay: rgba(0, 0, 0, 0.5);

  /* Text */
  --text-primary: var(--color-gray-900);
  --text-secondary: var(--color-gray-500);
  --text-inverse: var(--color-white);
  --text-link: var(--brand-primary);
  --text-link-hover: var(--brand-primary-hover);

  /* Borders */
  --border-default: var(--color-gray-200);
  --border-focus: var(--brand-primary);
  --border-error: var(--color-red-500);

  /* Feedback */
  --feedback-error: var(--color-red-600);
  --feedback-success: var(--color-green-600);

  /* Typography */
  --font-body: var(--font-sans);
  --font-heading: var(--font-sans);
  --font-code: var(--font-mono);

  /* Radius */
  --radius-button: var(--radius-md);
  --radius-card: var(--radius-lg);
  --radius-input: var(--radius-md);

  /* Spacing */
  --spacing-card-padding: var(--space-4);
  --spacing-section-gap: var(--space-8);

  /* Logo / Branding */
  --brand-logo-url: url('/assets/logo.svg');
  --brand-logo-width: 120px;
  --brand-logo-height: 40px;
}
```

#### Tier 3: Dark Mode

Dark mode overrides Tier 2 tokens only. Applied via media query AND manual toggle.

```css
/* Automatic: follows system preference */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --surface-page: var(--color-gray-900);
    --surface-card: var(--color-gray-800);
    --surface-elevated: var(--color-gray-700);
    --text-primary: var(--color-gray-50);
    --text-secondary: var(--color-gray-200);
    --border-default: var(--color-gray-700);
  }
}

/* Manual toggle: explicit dark mode */
[data-theme="dark"] {
  --surface-page: var(--color-gray-900);
  --surface-card: var(--color-gray-800);
  --surface-elevated: var(--color-gray-700);
  --text-primary: var(--color-gray-50);
  --text-secondary: var(--color-gray-200);
  --border-default: var(--color-gray-700);
}
```

### Component Token Usage Rules

- Components must **ONLY** reference Tier 2 (semantic) tokens.
- **Zero hardcoded colors, font families, or border-radius values** in component CSS.
- If a component needs a new visual property, add a new Tier 2 token -- never reference a Tier 1 primitive directly from a component.

```css
/* WRONG: hardcoded values in component */
.card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  font-family: 'Inter', sans-serif;
  color: #111827;
}

/* WRONG: referencing Tier 1 primitive from component */
.card {
  background: var(--color-white);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
}

/* CORRECT: referencing Tier 2 semantic tokens */
.card {
  background: var(--surface-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-card);
  font-family: var(--font-body);
  color: var(--text-primary);
}
```

### Customer Override Pattern

Customers override the theme by loading a single CSS file **after** the base theme:

```html
<link rel="stylesheet" href="/css/base-theme.css">
<link rel="stylesheet" href="/css/customer-overrides.css"> <!-- loaded second -->
```

The customer override file redefines only the Tier 2 tokens they want to change:

```css
/* customer-overrides.css */
:root {
  --brand-primary: #e11d48;
  --brand-primary-hover: #be123c;
  --font-heading: 'Poppins', sans-serif;
  --radius-button: 9999px; /* pill buttons */
  --brand-logo-url: url('/assets/customer-logo.svg');
}
```

No other files need to change. The entire visual identity updates through token reassignment.

### Logo and Branding

Logos and brand assets are configured through CSS custom properties or a site configuration object:

```css
.site-logo {
  background-image: var(--brand-logo-url);
  width: var(--brand-logo-width);
  height: var(--brand-logo-height);
  background-size: contain;
  background-repeat: no-repeat;
}
```

### Audit Checklist -- Run Every Cycle

Run these checks each iteration to catch regressions:

```bash
# Find hardcoded hex colors in component CSS (excluding token definition files)
grep -rn '#[0-9a-fA-F]\{3,8\}' src/components/ --include='*.css' --include='*.html'

# Find hardcoded font-family in components
grep -rn 'font-family:' src/components/ --include='*.css' --include='*.html'

# Find hardcoded border-radius in components
grep -rn 'border-radius:' src/components/ --include='*.css' --include='*.html' | grep -v 'var(--'
```

Any matches must be replaced with Tier 2 token references.

### Common Findings and Fixes -- White-Label CSS

| Finding | Fix |
|---|---|
| Hardcoded hex color in component (`color: #3b82f6`) | Replace with semantic token: `color: var(--brand-primary)` |
| Hardcoded `font-family` in component | Replace with `var(--font-body)` or `var(--font-heading)` |
| Hardcoded `border-radius` in component | Replace with `var(--radius-card)`, `var(--radius-button)`, etc. |
| Component references Tier 1 primitive (`var(--color-blue-500)`) | Map through a Tier 2 token instead |
| Dark mode not applied to a new component | Ensure the component uses only Tier 2 tokens (dark mode overrides those automatically) |
| Customer override requires editing base theme files | Add a missing Tier 2 token so the customer file can override it |
| Logo hardcoded as an `<img>` src | Use CSS custom property `var(--brand-logo-url)` via background-image |

---

## 4. Usability Testing Standards

### Test Matrix

Test at all of these viewport sizes across relevant device types:

| Viewport | Device Example | Type |
|---|---|---|
| 320x568 | iPhone SE (1st gen) | Phone |
| 375x667 | iPhone SE (2nd/3rd gen) | Phone |
| 375x812 | iPhone X / 12 Mini | Phone |
| 390x844 | iPhone 14 | Phone |
| 414x896 | iPhone 11 / XR | Phone |
| 768x1024 | iPad (portrait) | Tablet |
| 1024x768 | iPad (landscape) | Tablet |
| 1024x1366 | iPad Pro 12.9 (portrait) | Tablet |
| 1280x800 | Small laptop | Desktop |
| 1440x900 | Standard laptop | Desktop |
| 1920x1080 | Full HD monitor | Desktop |
| 2560x1440 | QHD / Ultrawide | Desktop |

### Cross-Device Checks

For each viewport in the matrix, verify:

**Layout and Spacing**
- [ ] No dead zones (untappable/unreachable areas, content behind fixed elements).
- [ ] No horizontal overflow or unintended horizontal scroll.
- [ ] Font sizes scale smoothly -- no text that is too small to read or too large for its container.
- [ ] Spacing is proportional -- padding and margins feel balanced at every size.
- [ ] Images and media scale correctly within their containers.

**Component Parity**
- [ ] All components visible on desktop are also accessible on mobile (may be behind a menu or toggle, but must be reachable).
- [ ] Tables either scroll horizontally, stack vertically, or use a responsive pattern -- no clipping.
- [ ] Modals and overlays are fully visible and dismissible at every size.

**Touch vs Mouse**
- [ ] All tap targets meet 44x44px minimum on touch devices.
- [ ] Hover states have equivalent focus/active states for touch and keyboard.
- [ ] No functionality requires hover (tooltips must have tap/focus alternatives).

### Interaction Checks

- [ ] Every tappable/clickable element provides **visual feedback** (color change, scale, ripple, or opacity shift) within 100ms.
- [ ] No unintended zoom on input focus (ensure `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5">` is set; use `font-size: 16px` or larger on inputs).
- [ ] Swipe gestures (if used) have button alternatives for accessibility.
- [ ] All keyboard shortcuts have visible on-screen alternatives.
- [ ] Focus order follows a logical reading order (left-to-right, top-to-bottom).
- [ ] Escape key closes modals, popovers, and dropdown menus.

### Pass Criteria

- A viewport passes when **all** checks above are satisfied with zero issues.
- The full test matrix must achieve **two consecutive clean passes** before declaring usability testing complete.
- A "clean pass" means running through every viewport in the matrix with zero new findings.
- If a fix is applied between passes, the count resets. The two clean passes must be consecutive after the last code change.

### Testing Process

1. Run through the full matrix systematically (smallest viewport first, working up).
2. Log every finding with: viewport size, device type, page/component, description, screenshot.
3. Fix all findings.
4. Run the full matrix again (Pass 1).
5. If clean, run the full matrix one more time (Pass 2).
6. If any finding appears in Pass 1 or Pass 2, fix it and restart the two-pass sequence.

### Common Findings and Fixes -- Usability

| Finding | Fix |
|---|---|
| Horizontal scroll at 320px | Check for fixed-width elements; use `max-width: 100%` and `overflow-x: hidden` on containers |
| Text truncated without ellipsis or overflow handling | Add `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` or allow wrapping |
| Input zooms on focus (iOS) | Set `font-size: 16px` minimum on input elements |
| Modal extends beyond viewport on mobile | Use `max-height: 100dvh; overflow-y: auto` on the modal body |
| Touch target too small on mobile nav icons | Increase icon button padding to achieve 44x44px minimum |
| No visual feedback on button tap | Add `:active` style with opacity or scale change |
| Content hidden behind fixed header/footer | Add appropriate `padding-top` or `scroll-margin-top` |
| Table overflows container on mobile | Wrap in a `div` with `overflow-x: auto` or use a stacked layout |

---

## 5. Code Quality Standards

### File Headers

Every source file must begin with a comment block stating its purpose:

```javascript
/**
 * news-feed.js
 * Fetches and renders the tech news feed from configured RSS sources.
 * Used by the main index page and the category filter pages.
 */
```

```css
/**
 * tokens.css
 * Defines the 3-tier design token system (primitives, semantic, dark mode).
 * This file is the single source of truth for all visual properties.
 */
```

### Documentation Comments

All exported/public functions must have doc comments covering:

- **What** the function does (one sentence).
- **Parameters** with types and descriptions.
- **Return value** with type and description.
- **Exceptions/errors** thrown or propagated.

```javascript
/**
 * Fetches news articles from the given RSS feed URL and returns parsed items.
 *
 * @param {string} feedUrl - The full URL of the RSS feed to fetch.
 * @param {number} [limit=20] - Maximum number of articles to return.
 * @returns {Promise<Article[]>} Parsed articles sorted by publication date (newest first).
 * @throws {FetchError} When the feed URL is unreachable or returns a non-200 status.
 * @throws {ParseError} When the response body is not valid RSS/Atom XML.
 */
async function fetchFeed(feedUrl, limit = 20) {
  // ...
}
```

### Inline Comments

- Inline comments explain **WHY**, not **WHAT**. The code itself should be readable enough to convey what it does.
- Never leave commented-out code in the codebase. Use version control to retrieve old code.

```javascript
// WRONG: explains what (obvious from the code)
// Increment the counter by 1
counter += 1;

// WRONG: commented-out code
// const oldValue = fetchLegacyData();
// if (oldValue) { migrateLegacy(oldValue); }

// CORRECT: explains why
// Feed API returns dates in UTC but without timezone suffix; force UTC parsing
// to avoid local timezone drift on the client.
const publishedAt = new Date(item.pubDate + 'Z');
```

### Logging Standards

- Use **structured logging** (JSON format) in all environments.
- Use correct log levels:
  - `debug` -- Detailed diagnostic information for development.
  - `info` -- Routine operational events (startup, config loaded, request served).
  - `warn` -- Unexpected but recoverable conditions (fallback used, deprecated API called).
  - `error` -- Failures that require attention (unhandled exception, external service down).
- **NEVER log** PII (names, emails, addresses), secrets, tokens, passwords, or session IDs.
- Include correlation/request IDs in log entries for traceability.

```javascript
// WRONG: logging sensitive data
logger.info(`User logged in: ${user.email} with token ${user.authToken}`);

// CORRECT: structured, no sensitive data
logger.info({ event: 'user_login', userId: user.id, method: 'oauth' });
```

### Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Variables and functions | camelCase | `feedItems`, `fetchNews()` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`, `API_BASE_URL` |
| CSS classes | kebab-case | `news-card`, `btn-primary` |
| CSS custom properties | kebab-case with tier prefix | `--brand-primary`, `--color-blue-500` |
| Files | kebab-case | `news-feed.js`, `base-theme.css` |
| HTML IDs | kebab-case | `main-content`, `search-input` |
| Boolean variables | Prefixed with is/has/should | `isLoading`, `hasError`, `shouldRetry` |

### Complexity Limits

| Metric | Limit |
|---|---|
| Maximum function length | 40 lines |
| Maximum file length | 400 lines |
| Maximum function parameters | 4 (use an options object for more) |
| Maximum nesting depth | 3 levels |

When a function exceeds 40 lines, extract helper functions. When a file exceeds 400 lines, split into modules by responsibility. When a function needs more than 4 parameters, refactor to accept an options/config object.

```javascript
// WRONG: too many parameters
function renderCard(title, description, imageUrl, author, date, category, isSticky) { ... }

// CORRECT: options object
function renderCard({ title, description, imageUrl, author, date, category, isSticky }) { ... }
```

### Type Safety

- Prefer TypeScript over plain JavaScript for any project with more than a few files.
- For Alpine.js/static projects where TypeScript is not used, add JSDoc type annotations to all exported functions.
- Use `@ts-check` at the top of JavaScript files where possible.

### Common Findings and Fixes -- Code Quality

| Finding | Fix |
|---|---|
| Function longer than 40 lines | Extract logical blocks into named helper functions |
| File longer than 400 lines | Split into focused modules; one responsibility per file |
| More than 4 function parameters | Refactor to accept an options object |
| Commented-out code blocks | Delete them; use git history to recover if needed |
| Inline comment explains "what" | Rewrite to explain "why" or remove if the code is self-explanatory |
| Missing doc comment on exported function | Add JSDoc with `@param`, `@returns`, and `@throws` |
| Logging includes email or token | Remove PII; log only non-sensitive identifiers |
| No file header comment | Add a block comment with file name and purpose |
| Inconsistent naming (mix of camelCase and snake_case) | Standardize per the naming conventions table |

---

## 6. Documentation Standards

### Required Documents

Every project must maintain these documents at the repository root (or in a `/docs` directory):

| Document | Purpose |
|---|---|
| `README.md` | Project overview, quick start, prerequisites, how to run locally |
| `ARCHITECTURE.md` | System design, component relationships, data flow, key decisions |
| `SECURITY.md` | Security policy, how to report vulnerabilities, security contacts |
| `CHANGELOG.md` | Release history following Keep a Changelog format |
| `CONTRIBUTING.md` | How to contribute, branch strategy, PR process, coding standards reference |
| `DEPLOYMENT.md` | Step-by-step deployment instructions, environment variables, rollback procedure |
| `WHITE_LABEL_GUIDE.md` | How to customize the theme, which tokens to override, example customer configs |

### CHANGELOG Format

Follow [Keep a Changelog](https://keepachangelog.com/) conventions:

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- Share button panel for items and page (#7)

### Changed
- Updated tab navigation to support software categories (#6)

### Fixed
- Fixed mobile layout overflow at 320px viewport

### Security
- Added SRI hashes to all CDN script tags

## [1.0.0] - 2026-01-15

### Added
- Initial release with tech news feed aggregation
- Category filtering
- Responsive layout with dark mode support
```

Categories to use (in this order, omit empty categories):

- **Added** -- New features.
- **Changed** -- Changes to existing functionality.
- **Deprecated** -- Features that will be removed in a future release.
- **Removed** -- Features that have been removed.
- **Fixed** -- Bug fixes.
- **Security** -- Vulnerability fixes.

### Documentation Maintenance

- **Update all docs after every iteration cycle.** This is not optional. If code changes, docs must reflect those changes in the same PR.
- Review documentation accuracy as part of the PR review checklist.
- Architecture diagrams must match the current state of the system (not a future aspiration).
- Deployment instructions must be tested by someone other than the author.
- The CHANGELOG must be updated in every PR that introduces user-facing changes.

### Common Findings and Fixes -- Documentation

| Finding | Fix |
|---|---|
| README does not explain how to run the project | Add a "Getting Started" section with prerequisites, install, and run commands |
| ARCHITECTURE.md is outdated or missing | Update to reflect current system; include component diagram and data flow |
| CHANGELOG not updated in PR | Add an entry under `[Unreleased]` in the correct category |
| DEPLOYMENT.md has stale environment variable list | Audit current code for env vars and update the doc |
| No SECURITY.md | Create one with vulnerability reporting instructions and security contact |
| WHITE_LABEL_GUIDE.md missing examples | Add at least 2 example customer override configurations |
| CONTRIBUTING.md references outdated branch strategy | Update to match current branch protection rules and merge process |
| Docs updated but not in the same PR as the code change | Enforce via PR checklist: "Documentation updated? Yes/No/Not applicable" |

---

## Applying These Standards

### New Projects

1. Set up the CI/CD pipeline with all stages from Section 1 before writing application code.
2. Create the token system (Section 3) before building any components.
3. Create all required documentation files (Section 6) with initial content.
4. Configure branch protection and Dependabot (Section 1).

### Existing Projects

1. Audit against each section and log all findings.
2. Prioritize security findings (Section 1) first.
3. Address white-label token compliance (Section 3) next -- this prevents rework.
4. Fix UX and accessibility issues (Section 2).
5. Run the full usability test matrix (Section 4).
6. Refactor code quality issues (Section 5) incrementally.
7. Update all documentation (Section 6).

### Per-Cycle Checklist

- [ ] All CI/CD pipeline stages pass.
- [ ] No new npm audit findings at high or critical.
- [ ] No hardcoded hex colors, font-family, or border-radius in components.
- [ ] All new components use only Tier 2 tokens.
- [ ] Accessibility checks pass (contrast, keyboard nav, screen reader).
- [ ] Usability test matrix: two consecutive clean passes.
- [ ] All exported functions have doc comments.
- [ ] No files exceed 400 lines; no functions exceed 40 lines.
- [ ] CHANGELOG updated.
- [ ] All documentation reflects current state.
