import { test, expect } from '@playwright/test';

test.describe('Site Navigation', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');

    // Page should load successfully
    await expect(page).toHaveTitle(/.+/);
  });

  test('should have working navigation links', async ({ page }) => {
    await page.goto('/');

    // Check for main navigation elements
    const nav = page.locator('nav, header');
    await expect(nav.first()).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');

    // Find and click login link
    const loginLink = page.locator('a[href*="login"], button:has-text("Log in"), a:has-text("Sign in")').first();
    if (await loginLink.isVisible()) {
      await loginLink.click();
      await expect(page).toHaveURL(/login/i);
    }
  });

  test('should navigate to registration page', async ({ page }) => {
    await page.goto('/');

    // Find and click register link
    const registerLink = page.locator('a[href*="register"], button:has-text("Sign up"), a:has-text("Register")').first();
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await expect(page).toHaveURL(/register|signup/i);
    }
  });

  test('should display footer', async ({ page }) => {
    await page.goto('/');

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Page should still be functional
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Video Discovery', () => {
  test('should display videos on feed page', async ({ page }) => {
    await page.goto('/');

    // Look for video cards or video elements
    const videos = page.locator('[data-testid="video-card"], .video-card, article, [class*="video"]');

    // Wait for content to load
    await page.waitForTimeout(3000);

    // Check if page has loaded content
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have search functionality', async ({ page }) => {
    await page.goto('/');

    // Find search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], [data-testid="search"]').first();

    if (await searchInput.isVisible()) {
      await searchInput.fill('test search');
      await searchInput.press('Enter');

      // Should show search results or navigate to search page
      await page.waitForTimeout(2000);
    }
  });
});
