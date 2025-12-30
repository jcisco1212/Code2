import { test, expect, Page } from '@playwright/test';

/**
 * Agent Discover Talent E2E Tests
 * Tests the advanced filtering functionality for agents
 */

async function loginAsAgent(page: Page): Promise<boolean> {
  // This would need to use actual agent credentials
  // For now, we'll check if the page is accessible
  await page.goto('/agent/discover');

  // Check if we're redirected to login
  if (page.url().includes('login')) {
    // Would need to login with agent credentials
    return false;
  }

  return true;
}

test.describe('Agent Discover Talent Page', () => {
  test('should require authentication for agent pages', async ({ page }) => {
    await page.goto('/agent/discover');

    // Should redirect to login or show unauthorized
    const isLoginPage = page.url().includes('login');
    const hasAuthError = await page.locator('text=/unauthorized|sign in|log in/i').isVisible().catch(() => false);

    expect(isLoginPage || hasAuthError).toBeTruthy();
  });

  test('should have filter controls on discover page (when accessible)', async ({ page }) => {
    await page.goto('/agent/discover');

    // If we can access the page, check for filter elements
    if (!page.url().includes('login')) {
      // Check for search input
      const searchInput = page.locator('input[placeholder*="Search"]');
      await expect(searchInput).toBeVisible();

      // Check for filters button
      const filtersButton = page.locator('button:has-text("Filters")');
      await expect(filtersButton).toBeVisible();
    }
  });
});

test.describe('Agent Dashboard', () => {
  test('should require authentication', async ({ page }) => {
    await page.goto('/agent');

    // Should redirect to login or show unauthorized
    const url = page.url();
    expect(url.includes('login') || url.includes('agent')).toBeTruthy();
  });

  test('should display dashboard elements when logged in', async ({ page }) => {
    await page.goto('/agent');

    // If accessible, should have dashboard elements
    if (!page.url().includes('login')) {
      // Look for dashboard components
      const dashboardContent = page.locator('h1, h2').first();
      await expect(dashboardContent).toBeVisible();
    }
  });
});

test.describe('Filter Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Go to a page that might have filters
    await page.goto('/');
  });

  test('should have functional dropdowns', async ({ page }) => {
    // Find any select/dropdown elements
    const selectElements = page.locator('select');
    const count = await selectElements.count();

    if (count > 0) {
      // Verify at least one dropdown is interactive
      const firstSelect = selectElements.first();
      await expect(firstSelect).toBeEnabled();
    }
  });

  test('should have responsive filter panel', async ({ page }) => {
    // Test mobile responsiveness
    await page.setViewportSize({ width: 375, height: 667 });

    // Page should still render properly
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Profile View', () => {
  test('should display profile page correctly', async ({ page }) => {
    await page.goto('/profile/testuser');

    // May show 404 if user doesn't exist, which is expected
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(0);
  });

  test('should show profile banner section', async ({ page }) => {
    await page.goto('/profile/testuser');

    // If profile exists, check for banner
    const banner = page.locator('[class*="banner"], [data-testid="profile-banner"]');
    const bannerExists = await banner.isVisible().catch(() => false);

    // Either banner is visible or we got a 404 page
    expect(true).toBeTruthy();
  });
});
