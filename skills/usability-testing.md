# Usability Testing Protocol

Reference for planning and executing usability tests across devices and screen sizes.

---

## Device / Screen Testing Matrix

Test every release against this matrix. Mark each cell as Pass, Fail, or N/A.

| Device Category | Screen Size | OS / Browser | Orientation | Status |
|----------------|-------------|--------------|-------------|--------|
| **Phone - Small** | 375 x 667 | iOS Safari (iPhone SE) | Portrait | |
| **Phone - Small** | 375 x 667 | iOS Safari (iPhone SE) | Landscape | |
| **Phone - Standard** | 390 x 844 | iOS Safari (iPhone 14) | Portrait | |
| **Phone - Standard** | 390 x 844 | Chrome Android (Pixel 7) | Portrait | |
| **Phone - Large** | 430 x 932 | iOS Safari (iPhone 14 Pro Max) | Portrait | |
| **Tablet - Small** | 768 x 1024 | Safari (iPad 10th gen) | Portrait | |
| **Tablet - Small** | 768 x 1024 | Safari (iPad 10th gen) | Landscape | |
| **Tablet - Large** | 1024 x 1366 | Safari (iPad Pro 12.9") | Portrait | |
| **Tablet - Large** | 1024 x 1366 | Safari (iPad Pro 12.9") | Landscape | |
| **Laptop** | 1366 x 768 | Chrome (Windows) | Landscape | |
| **Laptop** | 1440 x 900 | Safari (MacBook Air) | Landscape | |
| **Desktop** | 1920 x 1080 | Chrome (Windows) | Landscape | |
| **Desktop - Large** | 2560 x 1440 | Chrome / Firefox | Landscape | |
| **Ultrawide** | 3440 x 1440 | Chrome | Landscape | |

### Browser Coverage

| Browser | Versions to Test | Priority |
|---------|-----------------|----------|
| Chrome | Latest, Latest-1 | P0 |
| Safari | Latest, Latest-1 | P0 |
| Firefox | Latest | P1 |
| Edge | Latest | P1 |
| Samsung Internet | Latest | P2 |

### Testing Tools

| Tool | Purpose |
|------|---------|
| Chrome DevTools (Device Mode) | Quick responsive preview |
| BrowserStack / LambdaTest | Real device testing remotely |
| Physical devices | Final validation on real hardware |
| Responsively App | View multiple viewports simultaneously |

---

## Cross-Device Consistency Checklist

Verify the following across all devices in the testing matrix.

### Layout

- [ ] Content does not overflow horizontally (no horizontal scroll on any viewport)
- [ ] No content is clipped or hidden behind other elements
- [ ] Spacing is proportional and visually consistent across breakpoints
- [ ] Grid/column layouts collapse gracefully at smaller viewports
- [ ] Fixed/sticky elements (header, footer, FAB) do not overlap content
- [ ] Modal/dialog content is scrollable if it exceeds viewport height
- [ ] Content is readable without zooming on all devices

### Typography

- [ ] Base font size is at least 16px (prevents iOS zoom on input focus)
- [ ] Headings scale appropriately across breakpoints
- [ ] Line length stays between 45-75 characters for body text
- [ ] No text truncation hides critical information
- [ ] Font loading does not cause visible layout shift (FOUT/FOIT)

### Images and Media

- [ ] Images are responsive and do not exceed container width
- [ ] Images have correct aspect ratio (no stretching or squishing)
- [ ] Lazy-loaded images have placeholder or skeleton
- [ ] Videos and embeds are responsive (16:9 container)

### Navigation

- [ ] Primary navigation is accessible on all viewport sizes
- [ ] Mobile navigation (hamburger/bottom tabs) opens and closes correctly
- [ ] Active state is visible on current page link
- [ ] Back button / swipe-back works as expected
- [ ] Breadcrumbs truncate gracefully on narrow screens

---

## Interaction Testing Checklist

### Touch Interactions (Mobile / Tablet)

- [ ] All tap targets are at least 44 x 44 CSS pixels
- [ ] No tap targets overlap or are too close together (min 8px gap)
- [ ] Swipe gestures work where expected (carousel, dismiss, pull-to-refresh)
- [ ] Long press does not trigger unexpected context menus
- [ ] Pinch-to-zoom works on images where appropriate
- [ ] Scroll containers scroll smoothly (no janky scroll)
- [ ] Bottom sheet / drawer can be swiped to dismiss

### Keyboard Interactions (Desktop)

- [ ] Tab order follows visual layout (left-to-right, top-to-bottom)
- [ ] Focus indicator is visible on all focusable elements
- [ ] Enter/Space activates buttons and links
- [ ] Escape closes modals, dropdowns, and popovers
- [ ] Arrow keys navigate within menus, tabs, and select components
- [ ] No keyboard traps (user can always Tab away)
- [ ] Skip-to-content link works

### Form Interactions

- [ ] Input focus does not cause viewport to jump unexpectedly
- [ ] Virtual keyboard does not obscure the active input
- [ ] Autocomplete attributes are set correctly (name, email, tel, etc.)
- [ ] Date pickers work on both mobile (native) and desktop (custom)
- [ ] Validation messages appear near the relevant field
- [ ] Submit button is reachable without scrolling past errors
- [ ] Form preserves input on validation failure (no data loss)

### State Management

- [ ] Loading states show skeleton or spinner (no blank screens)
- [ ] Error states display a clear message and recovery action
- [ ] Empty states provide guidance (not just "No results")
- [ ] Offline state is handled gracefully (if applicable)
- [ ] Optimistic UI updates revert on failure

### Animation and Transitions

- [ ] Animations respect `prefers-reduced-motion` media query
- [ ] No animation causes layout shift (CLS)
- [ ] Transition durations feel responsive (150-300ms for micro-interactions)
- [ ] No animation blocks interaction (user can tap during animation)

---

## Iteration Reporting Template

Use this template to document findings from each test round.

```markdown
# Usability Test Report

**Date:** YYYY-MM-DD
**Tester:** [Name]
**Version / Branch:** [version or branch name]
**Environment:** [Production / Staging / Local]

## Summary

- **Devices tested:** [list from matrix]
- **Total issues found:** [count]
- **Critical:** [count] | **Major:** [count] | **Minor:** [count] | **Enhancement:** [count]

## Issues

### Issue 1: [Short title]

- **Severity:** Critical / Major / Minor / Enhancement
- **Device(s):** [affected devices]
- **Steps to reproduce:**
  1. ...
  2. ...
  3. ...
- **Expected:** [what should happen]
- **Actual:** [what happened]
- **Screenshot / Recording:** [link or inline]
- **Suggested fix:** [brief recommendation]

### Issue 2: [Short title]

...

## Passed Checks

[List any areas that were specifically verified and passed cleanly.]

## Recommendations

[Prioritised list of changes for the next iteration.]

## Sign-off

| Role | Name | Date | Approved |
|------|------|------|----------|
| Developer | | | [ ] |
| Designer | | | [ ] |
| QA | | | [ ] |
```

### Severity Definitions

| Severity | Definition | Action |
|----------|-----------|--------|
| **Critical** | Blocks core functionality; data loss; security issue | Must fix before release |
| **Major** | Feature broken on common device; accessibility failure | Must fix before release |
| **Minor** | Cosmetic issue; works but looks wrong on edge-case device | Fix in next sprint |
| **Enhancement** | Improvement opportunity; not a defect | Add to backlog |

---

## Completion Criteria

A release is ready for deployment when ALL of the following are true.

### Must-Pass Gates

1. **Zero Critical issues** -- no unresolved critical-severity findings.
2. **Zero Major issues** -- no unresolved major-severity findings.
3. **Matrix coverage >= 80%** -- at least 80% of the device/screen matrix cells are tested and passing (remaining cells are N/A with justification).
4. **P0 browsers pass** -- Chrome (latest) and Safari (latest) on both mobile and desktop pass all checks.
5. **Accessibility baseline met** -- axe DevTools reports zero critical or serious violations on all tested pages.
6. **Performance targets met:**
   - FCP < 1.5s on 4G connection
   - LCP < 2.5s on 4G connection
   - CLS < 0.1
7. **Core Web Vitals pass** in PageSpeed Insights (or Lighthouse) for the primary landing page.

### Should-Pass (Release with Exceptions)

- Minor issues may ship with documented follow-up tickets.
- Enhancement items are logged in the backlog, not blocking.
- P1 browser issues may ship if workaround exists and is documented.

### Sign-off Process

1. Tester completes the iteration report template above.
2. Developer reviews and confirms all critical/major fixes are merged.
3. At least one stakeholder (designer or product owner) signs off.
4. Report is committed to the repo under `docs/testing/` or attached to the release PR.
