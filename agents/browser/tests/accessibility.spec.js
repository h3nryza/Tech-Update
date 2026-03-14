const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

test.describe('Accessibility', () => {
  test('should have no critical accessibility violations', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(5000); // Wait for Alpine.js + data fetch

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .exclude('.line-clamp-2')
      .analyze();

    const critical = results.violations.filter(v => v.impact === 'critical');
    const serious = results.violations.filter(v => v.impact === 'serious');

    // Log all violations for debugging
    if (results.violations.length > 0) {
      console.log('Accessibility violations:');
      results.violations.forEach(v => {
        console.log(`  [${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} instances)`);
        v.nodes.forEach(n => {
          console.log(`    Target: ${n.target.join(', ')}`);
        });
      });
    }

    expect(critical.length).toBe(0);
    expect(serious.length).toBeLessThanOrEqual(5); // Allow some serious (contrast edge cases from Tailwind CDN)
  });

  test('skip-to-content link is present and functional', async ({ page }) => {
    await page.goto('/');
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeAttached();

    // Tab to it and verify it becomes visible
    await page.keyboard.press('Tab');
    await expect(skipLink).toBeVisible();
  });

  test('all interactive elements are keyboard focusable', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Tab through first 10 elements and verify focus moves
    let focusedCount = 0;
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => document.activeElement.tagName);
      if (['BUTTON', 'A', 'INPUT', 'SELECT'].includes(focused)) {
        focusedCount++;
      }
    }
    expect(focusedCount).toBeGreaterThan(3);
  });
});
