# White-Label Theming Guide

This guide explains how to customize Tech Update's appearance for different brands or customers using the CSS design token system.

---

## Token System Overview

The design token system is defined in `css/tokens.css` and uses a **3-tier architecture**:

### Tier 1: Primitive Tokens

Raw values -- color scales, spacing, typography, radii, shadows. These are the building blocks.

```css
--color-blue-500: #3b82f6;
--space-4: 1rem;
--radius-lg: 0.5rem;
```

**Do not reference Tier 1 tokens in components.** They exist only to be consumed by Tier 2.

### Tier 2: Semantic Tokens

Purpose-mapped tokens that describe *what* a value is used for, not *what* the value is.

```css
--brand-primary: var(--color-blue-500);
--surface-page: var(--color-white);
--text-primary: var(--color-slate-900);
--card-radius: var(--radius-lg);
```

**Components reference only Tier 2 tokens.** This is the layer you override for white-labeling.

### Tier 3: Dark Mode Overrides

Automatic dark mode support via `prefers-color-scheme: dark` (system preference) and `.dark` class / `[data-theme="dark"]` attribute (manual toggle).

```css
:root.dark {
  --brand-primary: var(--color-blue-400);
  --surface-page: var(--color-slate-900);
  --text-primary: var(--color-slate-100);
}
```

---

## How to Create a Customer Theme

### Step 1: Create a Theme File

Create a new CSS file in the `css/` directory:

```
css/customer-acme.css
```

### Step 2: Override Tier 2 Tokens

Only override the semantic tokens you need to change. The file should contain a `:root` block for light mode and a `:root.dark` / `[data-theme="dark"]` block for dark mode.

```css
/* css/customer-acme.css */

:root {
  /* Brand colors */
  --brand-primary:        #e11d48;
  --brand-primary-hover:  #be123c;
  --brand-primary-active: #9f1239;
  --brand-primary-light:  #ffe4e6;
  --brand-primary-subtle: #fff1f2;

  /* Focus and branding elements */
  --focus-ring-color:     #e11d48;
  --logo-color:           #e11d48;

  /* Typography */
  --font-family-heading:  "Poppins", var(--font-family-sans);
  --font-family-body:     "Inter", var(--font-family-sans);

  /* Shape */
  --card-radius:          1rem;
  --button-radius:        9999px;
}

:root.dark,
[data-theme="dark"] {
  --brand-primary:        #fb7185;
  --brand-primary-hover:  #fda4af;
  --brand-primary-active: #fecdd3;

  --focus-ring-color:     #fb7185;
  --logo-color:           #fb7185;
}
```

### Step 3: Load the Theme File

Add a `<link>` tag in `index.html` **after** `tokens.css` and **before** `style.css`:

```html
<link rel="stylesheet" href="css/tokens.css">
<link rel="stylesheet" href="css/customer-acme.css">  <!-- Customer theme -->
<link rel="stylesheet" href="css/style.css">
```

The customer file overrides the default Tier 2 values. Because `style.css` references the same custom properties, it automatically picks up the new values.

---

## Example Customer Theme File

Below is a complete example for a fictional company "NovaTech" with a purple brand identity:

```css
/* css/customer-novatech.css
   NovaTech brand theme -- purple primary, rounded components */

:root {
  /* Brand */
  --brand-primary:        #7c3aed;
  --brand-primary-hover:  #6d28d9;
  --brand-primary-active: #5b21b6;
  --brand-primary-light:  #ede9fe;
  --brand-primary-subtle: #f5f3ff;

  --brand-accent:         #06b6d4;
  --brand-accent-hover:   #0891b2;
  --brand-accent-active:  #0e7490;

  /* Branding elements */
  --focus-ring-color:     #7c3aed;
  --logo-color:           #7c3aed;

  /* Typography */
  --font-family-heading:  "Plus Jakarta Sans", var(--font-family-sans);

  /* Shape -- more rounded */
  --card-radius:    var(--radius-xl);
  --button-radius:  var(--radius-full);
  --input-radius:   var(--radius-lg);
}

:root.dark,
[data-theme="dark"] {
  --brand-primary:        #a78bfa;
  --brand-primary-hover:  #c4b5fd;
  --brand-primary-active: #ddd6fe;
  --brand-primary-light:  var(--color-purple-900);
  --brand-primary-subtle: var(--color-purple-950);

  --brand-accent:         #22d3ee;
  --brand-accent-hover:   #67e8f9;
  --brand-accent-active:  #a5f3fc;

  --focus-ring-color:     #a78bfa;
  --logo-color:           #a78bfa;
}
```

---

## Dark Mode Customization

Dark mode is handled at two levels:

### System Preference

When the user's OS is set to dark mode and no manual toggle has been applied, the `@media (prefers-color-scheme: dark)` block in `tokens.css` activates automatically. Customer themes should provide dark overrides to ensure brand colors work on dark backgrounds.

### Manual Toggle

The theme toggle button adds/removes the `dark` class on `<html>` and persists the choice in `localStorage`. Customer theme files must include the `:root.dark, [data-theme="dark"]` selector to support manual toggling.

### Dark Mode Checklist

When creating a customer theme, ensure:

- [ ] Primary brand color is lightened for dark backgrounds (use the 300-400 range instead of 500-700).
- [ ] Hover and active states shift lighter, not darker.
- [ ] Focus ring color is visible against dark surfaces.
- [ ] Any custom feedback colors (success, warning, error) have dark variants.

---

## Logo and Branding Customization

### Logo Color

The logo uses the `--logo-color` token. Override it in both light and dark modes:

```css
:root       { --logo-color: #e11d48; }
:root.dark  { --logo-color: #fb7185; }
```

### Logo Dimensions

Adjust the logo size with:

```css
:root {
  --logo-width:  2.5rem;
  --logo-height: 2.5rem;
}
```

### Page Title

The page title is set in `index.html` inside the `<title>` tag and in the header element. Update both for a customer deployment.

---

## Testing Theme Changes

### Quick Visual Test

1. Create or edit the customer CSS file.
2. Add the `<link>` tag to `index.html` (after `tokens.css`).
3. Open `index.html` in a browser.
4. Verify the following:
   - Brand color is applied to buttons, links, active tabs, and focus rings.
   - Toggle dark mode and verify dark brand colors.
   - Check that cards, inputs, and buttons use the correct border radius.
   - Verify text remains readable against all surface colors.

### Systematic Checklist

| Area             | What to Check                                          |
|------------------|--------------------------------------------------------|
| Brand color      | Primary buttons, active sidebar item, link color       |
| Hover states     | Button hover, link hover, card hover shadow            |
| Focus ring       | Tab through interactive elements; ring should be visible|
| Dark mode        | Toggle theme; all brand colors should adapt            |
| Typography       | Headings use `--font-family-heading` if overridden     |
| Border radius    | Cards, buttons, inputs match the overridden radius     |
| Feedback colors  | Success/warning/error banners (if visible)             |
| Accessibility    | Contrast ratio of brand color on white/dark surfaces   |

### Browser DevTools

Use the browser's CSS custom properties inspector to verify tokens are resolving correctly:

1. Open DevTools (F12).
2. Select an element (e.g., a primary button).
3. In the Styles panel, check that `var(--brand-primary)` resolves to your customer color.

---

## What NOT to Do

### Do Not Hardcode Colors in Components

```css
/* BAD */
.sidebar-link.active {
  color: #e11d48;
}

/* GOOD */
.sidebar-link.active {
  color: var(--brand-primary);
}
```

Hardcoded colors break theming because they cannot be overridden by the token system.

### Do Not Use `!important`

```css
/* BAD */
:root {
  --brand-primary: #e11d48 !important;
}

/* GOOD */
:root {
  --brand-primary: #e11d48;
}
```

`!important` on custom properties prevents downstream overrides and makes the system brittle. CSS specificity already handles the cascade correctly when files are loaded in the right order.

### Do Not Modify Tier 1 Tokens

```css
/* BAD -- changing a primitive breaks all tokens that reference it */
:root {
  --color-blue-500: #e11d48;
}

/* GOOD -- override the semantic token instead */
:root {
  --brand-primary: #e11d48;
}
```

Tier 1 tokens are the foundation. Changing `--color-blue-500` would affect every semantic token that references it, causing unpredictable side effects across the entire UI.

### Do Not Skip Dark Mode Overrides

If you change `--brand-primary` in light mode but not in dark mode, the dark theme will use the default blue, creating an inconsistent brand experience. Always provide both light and dark overrides for any brand token you change.

### Do Not Load the Customer File in the Wrong Order

The load order must be:
1. `tokens.css` (defaults)
2. `customer-*.css` (overrides)
3. `style.css` (component styles that consume tokens)

Loading the customer file after `style.css` will still work for simple property overrides, but loading it before `tokens.css` will cause the defaults to overwrite the customer values.
