# CSS White-Label Architecture Guide

Reference for building a themeable, white-label CSS architecture using a 3-tier design token system.

---

## 3-Tier Token System

The token system is organised into three layers. Each layer references the one below it, creating a chain from raw values to semantic meaning to component-specific usage.

```
Tier 1: Global (primitive) tokens   -- raw values, no context
Tier 2: Semantic (alias) tokens     -- purpose-driven, references Tier 1
Tier 3: Component tokens            -- scoped to a component, references Tier 2
```

### Tier 1: Global / Primitive Tokens

Raw design values with no implied usage. These are the single source of truth for colours, spacing, and typography scales.

```css
:root {
  /* ── Colour Palette ── */
  --color-blue-50:   #eff6ff;
  --color-blue-100:  #dbeafe;
  --color-blue-500:  #3b82f6;
  --color-blue-600:  #2563eb;
  --color-blue-700:  #1d4ed8;
  --color-blue-900:  #1e3a5f;

  --color-gray-50:   #f9fafb;
  --color-gray-100:  #f3f4f6;
  --color-gray-200:  #e5e7eb;
  --color-gray-400:  #9ca3af;
  --color-gray-600:  #4b5563;
  --color-gray-700:  #374151;
  --color-gray-800:  #1f2937;
  --color-gray-900:  #111827;

  --color-red-500:   #ef4444;
  --color-red-600:   #dc2626;

  --color-green-500: #22c55e;
  --color-green-600: #16a34a;

  --color-white:     #ffffff;
  --color-black:     #000000;

  /* ── Spacing Scale ── */
  --space-0:   0;
  --space-1:   4px;
  --space-2:   8px;
  --space-3:   12px;
  --space-4:   16px;
  --space-5:   20px;
  --space-6:   24px;
  --space-8:   32px;
  --space-10:  40px;
  --space-12:  48px;
  --space-16:  64px;

  /* ── Typography Scale ── */
  --font-size-xs:    0.75rem;   /* 12px */
  --font-size-sm:    0.875rem;  /* 14px */
  --font-size-base:  1rem;      /* 16px */
  --font-size-lg:    1.125rem;  /* 18px */
  --font-size-xl:    1.25rem;   /* 20px */
  --font-size-2xl:   1.5rem;    /* 24px */
  --font-size-3xl:   1.875rem;  /* 30px */

  --font-weight-normal:  400;
  --font-weight-medium:  500;
  --font-weight-bold:    700;

  --line-height-tight:   1.25;
  --line-height-normal:  1.5;
  --line-height-relaxed: 1.75;

  /* ── Border Radius ── */
  --radius-sm:   4px;
  --radius-md:   8px;
  --radius-lg:   12px;
  --radius-full: 9999px;

  /* ── Shadows ── */
  --shadow-sm:  0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md:  0 4px 6px rgba(0, 0, 0, 0.07);
  --shadow-lg:  0 10px 15px rgba(0, 0, 0, 0.1);
}
```

### Tier 2: Semantic / Alias Tokens

These give meaning to the primitives. A customer override file only needs to redefine these.

```css
:root {
  /* ── Brand ── */
  --brand-primary:           var(--color-blue-600);
  --brand-primary-hover:     var(--color-blue-700);
  --brand-primary-light:     var(--color-blue-50);

  /* ── Surface & Background ── */
  --surface-default:         var(--color-white);
  --surface-muted:           var(--color-gray-50);
  --surface-elevated:        var(--color-white);

  /* ── Text ── */
  --text-primary:            var(--color-gray-900);
  --text-secondary:          var(--color-gray-600);
  --text-muted:              var(--color-gray-400);
  --text-on-primary:         var(--color-white);
  --text-link:               var(--brand-primary);
  --text-link-hover:         var(--brand-primary-hover);

  /* ── Border ── */
  --border-default:          var(--color-gray-200);
  --border-strong:           var(--color-gray-400);

  /* ── Feedback ── */
  --feedback-success:        var(--color-green-600);
  --feedback-error:          var(--color-red-600);
  --feedback-warning:        #f59e0b;
  --feedback-info:           var(--color-blue-500);

  /* ── Focus ── */
  --focus-ring:              var(--brand-primary);
  --focus-ring-offset:       2px;

  /* ── Typography (semantic) ── */
  --font-family-body:        'Inter', system-ui, -apple-system, sans-serif;
  --font-family-heading:     var(--font-family-body);
  --font-family-mono:        'JetBrains Mono', ui-monospace, monospace;
}
```

### Tier 3: Component Tokens

Scoped to individual components. These reference Tier 2 tokens so that a brand override automatically cascades.

```css
:root {
  /* ── Button ── */
  --btn-bg:                  var(--brand-primary);
  --btn-bg-hover:            var(--brand-primary-hover);
  --btn-text:                var(--text-on-primary);
  --btn-border-radius:       var(--radius-md);
  --btn-padding-x:           var(--space-4);
  --btn-padding-y:           var(--space-2);
  --btn-font-size:           var(--font-size-sm);
  --btn-font-weight:         var(--font-weight-medium);

  /* ── Card ── */
  --card-bg:                 var(--surface-elevated);
  --card-border:             var(--border-default);
  --card-border-radius:      var(--radius-lg);
  --card-padding:            var(--space-6);
  --card-shadow:             var(--shadow-md);

  /* ── Input ── */
  --input-bg:                var(--surface-default);
  --input-border:            var(--border-default);
  --input-border-focus:      var(--focus-ring);
  --input-border-radius:     var(--radius-md);
  --input-padding-x:         var(--space-3);
  --input-padding-y:         var(--space-2);
  --input-font-size:         var(--font-size-base);
  --input-text:              var(--text-primary);
  --input-placeholder:       var(--text-muted);

  /* ── Header ── */
  --header-bg:               var(--surface-default);
  --header-border:           var(--border-default);
  --header-height:           64px;

  /* ── Sidebar ── */
  --sidebar-bg:              var(--surface-muted);
  --sidebar-width:           260px;
  --sidebar-link-active-bg:  var(--brand-primary-light);
  --sidebar-link-active-text: var(--brand-primary);
}
```

---

## Token Naming Conventions

### Format

```
--{category}-{property}-{variant}-{state}
```

| Segment | Examples | Notes |
|---------|----------|-------|
| `category` | `brand`, `surface`, `text`, `border`, `btn`, `card` | Noun describing the group |
| `property` | `bg`, `text`, `border`, `shadow`, `padding`, `font-size` | CSS-like shorthand |
| `variant` | `primary`, `secondary`, `muted`, `elevated` | Optional qualifier |
| `state` | `hover`, `focus`, `active`, `disabled` | Optional interaction state |

### Examples

```
--brand-primary
--brand-primary-hover
--text-secondary
--surface-elevated
--btn-bg-hover
--input-border-focus
--feedback-error
```

### Rules

1. Use kebab-case only.
2. Tier 1 tokens use a scale (`--color-blue-500`, `--space-4`).
3. Tier 2 tokens use semantic names (`--brand-primary`, `--text-secondary`).
4. Tier 3 tokens are prefixed with the component name (`--btn-*`, `--card-*`).
5. Never reference a Tier 1 token directly in component CSS -- always go through Tier 2 or 3.

---

## Customer Override Pattern

A customer-specific file redefines Tier 2 tokens only. It is loaded after the base stylesheet.

### File: `css/themes/customer-acme.css`

```css
/*
 * Theme: ACME Corp
 * Override Tier 2 semantic tokens only.
 * Tier 3 component tokens inherit automatically.
 */
:root {
  /* ── Brand Colours ── */
  --brand-primary:           #e63946;
  --brand-primary-hover:     #c1121f;
  --brand-primary-light:     #fef2f2;

  /* ── Surface ── */
  --surface-default:         #fafafa;
  --surface-muted:           #f0f0f0;
  --surface-elevated:        #ffffff;

  /* ── Text ── */
  --text-primary:            #1a1a2e;
  --text-secondary:          #555577;
  --text-on-primary:         #ffffff;

  /* ── Typography ── */
  --font-family-body:        'Roboto', system-ui, sans-serif;
  --font-family-heading:     'Roboto Slab', serif;
}
```

### Loading Order

```html
<!-- 1. Base design tokens (Tier 1 + 2 + 3 defaults) -->
<link rel="stylesheet" href="/css/tokens.css" />

<!-- 2. Component styles (reference Tier 3 tokens) -->
<link rel="stylesheet" href="/css/components.css" />

<!-- 3. Customer override (redefines Tier 2 tokens) -->
<link rel="stylesheet" href="/css/themes/customer-acme.css" />
```

Or dynamically:

```javascript
function loadTheme(customerSlug) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `/css/themes/customer-${customerSlug}.css`;
  document.head.appendChild(link);
}
```

---

## Dark Mode Implementation

### Strategy: Override Tier 2 Tokens with `prefers-color-scheme` and a Manual Toggle

```css
/* ── Dark mode via media query ── */
@media (prefers-color-scheme: dark) {
  :root {
    --surface-default:     #0f172a;
    --surface-muted:       #1e293b;
    --surface-elevated:    #1e293b;

    --text-primary:        #f1f5f9;
    --text-secondary:      #94a3b8;
    --text-muted:          #64748b;

    --border-default:      #334155;
    --border-strong:       #475569;

    --card-shadow:         0 4px 6px rgba(0, 0, 0, 0.3);
  }
}

/* ── Dark mode via manual toggle (data attribute) ── */
[data-theme="dark"] {
  --surface-default:     #0f172a;
  --surface-muted:       #1e293b;
  --surface-elevated:    #1e293b;

  --text-primary:        #f1f5f9;
  --text-secondary:      #94a3b8;
  --text-muted:          #64748b;

  --border-default:      #334155;
  --border-strong:       #475569;

  --card-shadow:         0 4px 6px rgba(0, 0, 0, 0.3);
}
```

### Toggle Script

```javascript
function initThemeToggle() {
  const toggle = document.getElementById('theme-toggle');
  const stored = localStorage.getItem('theme');
  if (stored) {
    document.documentElement.setAttribute('data-theme', stored);
  }
  toggle?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });
}
```

### Customer + Dark Mode Combination

Customer overrides are loaded after the base dark mode rules. If a customer needs custom dark mode values, add a `[data-theme="dark"]` block in their override file:

```css
/* css/themes/customer-acme.css */
:root {
  --brand-primary: #e63946;
}

[data-theme="dark"] {
  --brand-primary: #ff6b6b;
  --surface-default: #1a1a2e;
}
```

---

## Component Token Mapping Table

| Component | Token | Default Value (Tier 2 Reference) |
|-----------|-------|----------------------------------|
| **Button** | `--btn-bg` | `--brand-primary` |
| | `--btn-bg-hover` | `--brand-primary-hover` |
| | `--btn-text` | `--text-on-primary` |
| | `--btn-border-radius` | `--radius-md` |
| | `--btn-padding-x` | `--space-4` |
| | `--btn-padding-y` | `--space-2` |
| **Card** | `--card-bg` | `--surface-elevated` |
| | `--card-border` | `--border-default` |
| | `--card-border-radius` | `--radius-lg` |
| | `--card-padding` | `--space-6` |
| | `--card-shadow` | `--shadow-md` |
| **Input** | `--input-bg` | `--surface-default` |
| | `--input-border` | `--border-default` |
| | `--input-border-focus` | `--focus-ring` |
| | `--input-text` | `--text-primary` |
| | `--input-placeholder` | `--text-muted` |
| **Header** | `--header-bg` | `--surface-default` |
| | `--header-border` | `--border-default` |
| **Sidebar** | `--sidebar-bg` | `--surface-muted` |
| | `--sidebar-link-active-bg` | `--brand-primary-light` |
| | `--sidebar-link-active-text` | `--brand-primary` |
| **Badge** | `--badge-bg-success` | `--feedback-success` |
| | `--badge-bg-error` | `--feedback-error` |
| | `--badge-bg-warning` | `--feedback-warning` |
| | `--badge-bg-info` | `--feedback-info` |

---

## Audit Checklist

Run these commands to find hardcoded values that should use tokens.

### Hardcoded Hex Colours

```bash
# Find hex colours not inside token definitions
grep -rn --include='*.css' --include='*.scss' '#[0-9a-fA-F]\{3,8\}' css/ \
  | grep -v 'tokens.css' \
  | grep -v 'themes/'
```

### Hardcoded Pixel Values (Spacing)

```bash
# Find raw pixel values that should use spacing tokens
grep -rn --include='*.css' --include='*.scss' -E '(margin|padding|gap):\s*[0-9]+px' css/ \
  | grep -v 'tokens.css'
```

### Hardcoded Font Sizes

```bash
# Find raw font-size declarations
grep -rn --include='*.css' --include='*.scss' 'font-size:' css/ \
  | grep -v 'var(--' \
  | grep -v 'tokens.css'
```

### Hardcoded Border Radius

```bash
# Find raw border-radius values
grep -rn --include='*.css' --include='*.scss' 'border-radius:' css/ \
  | grep -v 'var(--' \
  | grep -v 'tokens.css'
```

### Hardcoded Box Shadows

```bash
# Find raw box-shadow values
grep -rn --include='*.css' --include='*.scss' 'box-shadow:' css/ \
  | grep -v 'var(--' \
  | grep -v 'tokens.css'
```

### Hardcoded Font Families

```bash
# Find font-family declarations not using tokens
grep -rn --include='*.css' --include='*.scss' 'font-family:' css/ \
  | grep -v 'var(--' \
  | grep -v 'tokens.css'
```

---

## Common Mistakes and How to Avoid Them

### 1. Referencing Tier 1 tokens directly in components

```css
/* WRONG */
.card { background: var(--color-white); }

/* RIGHT */
.card { background: var(--card-bg); }
```

Why: if a customer changes their surface colour, the card will not update.

### 2. Skipping Tier 3 and referencing Tier 2 directly

```css
/* ACCEPTABLE but inflexible */
.card { background: var(--surface-elevated); }

/* BETTER -- allows per-component overrides */
.card { background: var(--card-bg); }
```

### 3. Using `!important` to override tokens

```css
/* WRONG */
.btn { background: var(--brand-primary) !important; }

/* RIGHT -- specificity is managed by load order */
.btn { background: var(--btn-bg); }
```

### 4. Hardcoding colours in pseudo-elements or SVGs

```css
/* WRONG */
.icon::before { color: #3b82f6; }

/* RIGHT */
.icon::before { color: var(--brand-primary); }
```

### 5. Forgetting dark mode for custom components

Every new component that introduces colours must also be tested in dark mode. If the component uses Tier 2/3 tokens, dark mode works automatically. If you add a one-off colour, add a `[data-theme="dark"]` override.

### 6. Defining too many component tokens

Not every CSS property needs a token. Tokenise values that:
- Are likely to change per brand (colours, fonts, border radius)
- Are reused in multiple places (spacing, shadow)

Do not tokenise values that are structural (e.g., `display: flex`, `position: relative`).

### 7. Inconsistent naming

Agree on naming conventions before starting. Use the format in the naming conventions section above. A token named `--primary-btn-color` and another named `--card-text-color` break the pattern -- both should follow `--{component}-{property}`.
