# UX Architecture and Component Placement Guide

Reference for responsive design, accessibility, and component placement decisions.

---

## Responsive Breakpoint Reference

| Name | Min Width | Max Width | Typical Devices |
|------|-----------|-----------|-----------------|
| `xs` | 0 | 479px | Small phones (portrait) |
| `sm` | 480px | 767px | Large phones (landscape), small tablets |
| `md` | 768px | 1023px | Tablets (portrait), small laptops |
| `lg` | 1024px | 1279px | Laptops, tablets (landscape) |
| `xl` | 1280px | 1535px | Desktops |
| `2xl` | 1536px | -- | Large desktops, ultrawide |

### CSS Custom Properties

```css
:root {
  --bp-sm: 480px;
  --bp-md: 768px;
  --bp-lg: 1024px;
  --bp-xl: 1280px;
  --bp-2xl: 1536px;
}
```

### Media Query Pattern (Mobile-First)

```css
/* Base: mobile (xs) */
.container { padding: 16px; }

/* sm and up */
@media (min-width: 480px) { .container { padding: 20px; } }

/* md and up */
@media (min-width: 768px) { .container { padding: 24px; max-width: 720px; } }

/* lg and up */
@media (min-width: 1024px) { .container { padding: 32px; max-width: 960px; } }

/* xl and up */
@media (min-width: 1280px) { .container { max-width: 1200px; } }
```

---

## Tap Target Sizing Rules

### Minimum Sizes

| Standard | Minimum Size | Recommended |
|----------|-------------|-------------|
| WCAG 2.5.8 (AAA) | 44 x 44 px | 48 x 48 px |
| Material Design | 48 x 48 dp | 48 x 48 dp |
| Apple HIG | 44 x 44 pt | 44 x 44 pt |

### Rules

1. **Minimum touch target: 44 x 44 CSS pixels.** This is non-negotiable for interactive elements on touch devices.
2. **Spacing between targets: at least 8px** to prevent accidental taps.
3. **Padding counts.** A 24px icon inside a 44px padded container is compliant.
4. **Inline text links** are exempt from target size if surrounded by sufficient spacing, but prefer larger targets where possible.

### Implementation Pattern

```css
/* Ensure minimum tap target even for small icons */
.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  padding: 10px;
  cursor: pointer;
}

/* Ensure link tap targets in lists */
.nav-link {
  display: block;
  padding: 12px 16px;
  min-height: 44px;
}
```

---

## Button Placement Hierarchy

### Priority Order

| Priority | Type | Colour / Style | Placement |
|----------|------|----------------|-----------|
| 1 | Primary action | Solid, brand colour | Right-most or bottom-most |
| 2 | Secondary action | Outlined or ghost | Left of primary |
| 3 | Tertiary / link | Text-only, underlined | Far left or inline |
| 4 | Destructive | Red / outlined red | Separated from group; requires confirmation |

### Layout Rules

- **Forms / dialogs**: Primary button right, Cancel left. Follows the natural reading flow toward the action.
- **Mobile full-width**: Stack buttons vertically -- primary on top (thumb-reachable), secondary below.
- **Toolbar / header**: Primary right-aligned, secondary actions grouped left.
- **Destructive actions**: Never place adjacent to the primary action. Use colour differentiation and a confirmation step.

### Example: Dialog Footer

```html
<div class="dialog-actions">
  <button class="btn btn--text">Cancel</button>
  <button class="btn btn--secondary">Save Draft</button>
  <button class="btn btn--primary">Submit</button>
</div>
```

```css
.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
}
```

---

## Navigation Patterns

### When to Use Each Pattern

| Pattern | Best For | Avoid When |
|---------|----------|------------|
| **Top bar** | Simple sites with 2-6 top-level items | Many categories or deep hierarchy |
| **Sidebar** | Dashboards, admin panels, apps with 7+ sections | Mobile-only apps, simple content sites |
| **Bottom tabs** | Mobile apps with 3-5 primary destinations | More than 5 items; desktop layouts |
| **Hamburger menu** | Secondary nav, overflow items | Primary navigation (hides discoverability) |
| **Breadcrumbs** | Deep hierarchies, e-commerce categories | Flat site structures |

### Sidebar Navigation

```html
<nav class="sidebar" aria-label="Main navigation">
  <ul class="sidebar__list">
    <li><a href="/dashboard" class="sidebar__link sidebar__link--active" aria-current="page">Dashboard</a></li>
    <li><a href="/reports" class="sidebar__link">Reports</a></li>
    <li><a href="/settings" class="sidebar__link">Settings</a></li>
  </ul>
</nav>
```

- Collapse to hamburger below `md` breakpoint (768px).
- Active state must be visually distinct (not colour-only -- use a left border or background).
- Use `aria-current="page"` on the active link.

### Bottom Tabs (Mobile)

```html
<nav class="bottom-tabs" aria-label="Primary navigation">
  <a href="/home" class="bottom-tabs__item bottom-tabs__item--active" aria-current="page">
    <svg class="bottom-tabs__icon">...</svg>
    <span class="bottom-tabs__label">Home</span>
  </a>
  <a href="/search" class="bottom-tabs__item">
    <svg class="bottom-tabs__icon">...</svg>
    <span class="bottom-tabs__label">Search</span>
  </a>
  <!-- max 5 items -->
</nav>
```

```css
.bottom-tabs {
  display: flex;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: var(--surface);
  border-top: 1px solid var(--border);
  z-index: 100;
}

.bottom-tabs__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  text-decoration: none;
  font-size: 12px;
}
```

---

## Form Design Patterns

### Labels and Inputs

1. **Always use visible labels.** Placeholder text is not a substitute.
2. **Place labels above inputs** on mobile; above or left-aligned on desktop.
3. **Associate labels with inputs** using `for` / `id` or wrapping.
4. **Group related fields** with `<fieldset>` and `<legend>`.

```html
<div class="form-field">
  <label for="email" class="form-field__label">
    Email address
    <span class="form-field__required" aria-hidden="true">*</span>
  </label>
  <input
    type="email"
    id="email"
    name="email"
    class="form-field__input"
    required
    autocomplete="email"
    aria-describedby="email-hint"
  />
  <span id="email-hint" class="form-field__hint">We will never share your email.</span>
  <span class="form-field__error" role="alert" hidden>Please enter a valid email address.</span>
</div>
```

### Input Type Reference

| Data | HTML Type | Benefit |
|------|-----------|---------|
| Email | `type="email"` | Mobile keyboard with @ symbol |
| Phone | `type="tel"` | Numeric keypad on mobile |
| URL | `type="url"` | Keyboard with / and .com |
| Number | `type="text" inputmode="numeric"` | Numeric pad without spinners |
| Date | `type="date"` | Native date picker |
| Password | `type="password"` | Masked input, password managers |
| Search | `type="search"` | Clear button, search semantics |

### Validation Rules

- Validate on **blur** (field exit), not on every keystroke.
- Show errors **below the field**, not in alert boxes.
- Use `aria-invalid="true"` and `aria-describedby` pointing to the error message.
- Summarise errors at the top of the form with links to each invalid field on submit.

---

## Accessibility Checklist (WCAG 2.1 AA)

### Perceivable

- [ ] All images have descriptive `alt` text (or `alt=""` for decorative images)
- [ ] Colour contrast ratio is at least 4.5:1 for normal text, 3:1 for large text
- [ ] Information is not conveyed by colour alone (use icons, patterns, or text)
- [ ] Text can be resized to 200% without loss of content
- [ ] Captions provided for video content; transcripts for audio

### Operable

- [ ] All interactive elements are keyboard accessible (Tab, Enter, Escape, Arrow keys)
- [ ] Visible focus indicator on all focusable elements (min 2px, 3:1 contrast)
- [ ] No keyboard traps -- users can always Tab away from a component
- [ ] Skip-to-content link is the first focusable element
- [ ] Touch targets are at least 44 x 44 CSS pixels
- [ ] No content flashes more than 3 times per second

### Understandable

- [ ] Page language is declared (`<html lang="en">`)
- [ ] Form inputs have visible labels
- [ ] Error messages are clear and suggest how to fix the issue
- [ ] Navigation is consistent across pages

### Robust

- [ ] Valid HTML (no duplicate IDs, proper nesting)
- [ ] ARIA roles, states, and properties are correct
- [ ] Custom components work with screen readers (test with VoiceOver / NVDA)
- [ ] Page works without JavaScript for core content (progressive enhancement)

### Testing Tools

| Tool | Purpose |
|------|---------|
| axe DevTools (browser extension) | Automated accessibility audit |
| Lighthouse (Chrome DevTools) | Performance + accessibility score |
| WAVE | Visual overlay of accessibility issues |
| VoiceOver (macOS) | Screen reader testing |
| NVDA (Windows) | Screen reader testing |
| Colour Contrast Analyser | Manual contrast checking |

---

## Performance Targets

### Core Web Vitals

| Metric | Good | Needs Improvement | Poor |
|--------|------|--------------------|------|
| **LCP** (Largest Contentful Paint) | <= 2.5s | <= 4.0s | > 4.0s |
| **FID** (First Input Delay) | <= 100ms | <= 300ms | > 300ms |
| **INP** (Interaction to Next Paint) | <= 200ms | <= 500ms | > 500ms |
| **CLS** (Cumulative Layout Shift) | <= 0.1 | <= 0.25 | > 0.25 |
| **FCP** (First Contentful Paint) | <= 1.8s | <= 3.0s | > 3.0s |
| **TTFB** (Time to First Byte) | <= 800ms | <= 1800ms | > 1800ms |

### Targets for This Project

| Metric | Target |
|--------|--------|
| FCP | < 1.5s |
| LCP | < 2.0s |
| CLS | < 0.05 |
| INP | < 150ms |
| Total page weight | < 500 KB (initial load) |
| JavaScript bundle | < 100 KB gzipped |

### CLS Prevention Checklist

- [ ] Set explicit `width` and `height` on images and videos
- [ ] Reserve space for dynamic content (ads, embeds, lazy-loaded sections)
- [ ] Use `font-display: swap` or `font-display: optional` for web fonts
- [ ] Avoid inserting content above existing content after load
- [ ] Use CSS `contain: layout` on components that change size
- [ ] Prefer `transform` animations over layout-triggering properties (`top`, `left`, `width`, `height`)

### LCP Optimisation

- [ ] Preload the LCP image: `<link rel="preload" as="image" href="...">`
- [ ] Use responsive images with `srcset` and `sizes`
- [ ] Serve images in WebP/AVIF format
- [ ] Inline critical CSS, defer non-critical CSS
- [ ] Avoid render-blocking JavaScript in `<head>`
