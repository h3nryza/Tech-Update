const { test, expect } = require('@playwright/test');

test.describe('Dark Mode', () => {
  test('respects system dark mode preference', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await page.waitForTimeout(2000);

    const bg = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    // Should be a dark background
    expect(bg).not.toBe('rgb(249, 250, 251)'); // Not light gray
  });

  test('toggle persists to localStorage', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    const themeBtn = page.locator('button[title="Toggle theme"]');
    await themeBtn.click();
    await page.waitForTimeout(300);

    const stored = await page.evaluate(() => localStorage.getItem('theme'));
    expect(['dark', 'light']).toContain(stored);
  });
});
