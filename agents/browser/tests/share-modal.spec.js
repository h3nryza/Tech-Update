const { test, expect } = require('@playwright/test');

test.describe('Share Modal', () => {
  test('footer share button opens modal overlay', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    // Click the Share button in the footer
    const shareBtn = page.locator('button:has-text("Share")').last();
    await expect(shareBtn).toBeVisible();
    await shareBtn.click();

    // Modal overlay should appear
    const overlay = page.locator('.share-overlay');
    await expect(overlay).toBeVisible({ timeout: 3000 });

    // Modal panel should be visible
    const panel = page.locator('.share-panel');
    await expect(panel).toBeVisible();

    // Should have preview section
    const preview = panel.locator('pre');
    await expect(preview).toBeVisible();

    // Should have grid of share buttons (at least 8)
    const shareButtons = panel.locator('.grid button');
    const count = await shareButtons.count();
    expect(count).toBeGreaterThanOrEqual(8);
  });

  test('share modal has proper ARIA attributes', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    const shareBtn = page.locator('button:has-text("Share")').last();
    await shareBtn.click();
    await page.waitForTimeout(500);

    // Check aria-modal and role
    const dialog = page.locator('[role="dialog"][aria-modal="true"]');
    await expect(dialog).toBeVisible();
  });

  test('share modal closes on Escape', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    const shareBtn = page.locator('button:has-text("Share")').last();
    await shareBtn.click();
    await page.waitForTimeout(500);

    const overlay = page.locator('.share-overlay');
    await expect(overlay).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Modal should be gone
    await expect(overlay).not.toBeVisible();
  });

  test('share modal closes on backdrop click', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    const shareBtn = page.locator('button:has-text("Share")').last();
    await shareBtn.click();
    await page.waitForTimeout(500);

    const overlay = page.locator('.share-overlay');
    await expect(overlay).toBeVisible();

    // Click the overlay backdrop (not the panel)
    await overlay.click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(500);

    await expect(overlay).not.toBeVisible();
  });

  test('share modal shows 4-column grid layout', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    const shareBtn = page.locator('button:has-text("Share")').last();
    await shareBtn.click();
    await page.waitForTimeout(500);

    const grid = page.locator('.share-panel .grid');
    await expect(grid).toBeVisible();

    // Verify grid has grid-cols-4 class
    const hasGridCols = await grid.evaluate(el => el.classList.contains('grid-cols-4'));
    expect(hasGridCols).toBe(true);
  });

  test('copy button shows feedback', async ({ page }) => {
    // Grant clipboard permission
    await page.context().grantPermissions(['clipboard-write', 'clipboard-read']);

    await page.goto('/');
    await page.waitForTimeout(3000);

    const shareBtn = page.locator('button:has-text("Share")').last();
    await shareBtn.click();
    await page.waitForTimeout(500);

    // Click Copy button (first in grid)
    const copyBtn = page.locator('.share-panel .grid button').first();
    await copyBtn.click();
    await page.waitForTimeout(500);

    // Toast should appear
    const toast = page.locator('text=copied');
    await expect(toast.first()).toBeVisible({ timeout: 3000 });
  });
});
