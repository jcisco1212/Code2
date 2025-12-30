import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  const testEmail = `e2e_test_${Date.now()}@example.com`;
  const testUsername = `e2euser_${Date.now()}`;
  const testPassword = 'TestPassword123!';

  test('should display login page', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('h1, h2').first()).toContainText(/sign in|log in|welcome/i);
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should display registration page', async ({ page }) => {
    await page.goto('/register');

    await expect(page.locator('h1, h2').first()).toContainText(/sign up|register|create/i);
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should show validation errors for invalid registration', async ({ page }) => {
    await page.goto('/register');

    // Try to submit with invalid data
    await page.fill('input[type="email"], input[name="email"]', 'invalid-email');
    await page.fill('input[type="password"]', '123');

    // Try to submit
    await page.click('button[type="submit"]');

    // Should show validation errors
    await expect(page.locator('text=/invalid|error|required/i')).toBeVisible({ timeout: 5000 });
  });

  test('should register a new user successfully', async ({ page }) => {
    await page.goto('/register');

    // Fill registration form
    await page.fill('input[name="email"], input[type="email"]', testEmail);
    await page.fill('input[name="username"]', testUsername);
    await page.fill('input[name="password"], input[type="password"]', testPassword);

    // Fill name fields if they exist
    const firstNameInput = page.locator('input[name="firstName"]');
    if (await firstNameInput.isVisible()) {
      await firstNameInput.fill('E2E');
    }

    const lastNameInput = page.locator('input[name="lastName"]');
    if (await lastNameInput.isVisible()) {
      await lastNameInput.fill('Tester');
    }

    // Accept terms if checkbox exists
    const termsCheckbox = page.locator('input[type="checkbox"]');
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }

    // Submit
    await page.click('button[type="submit"]');

    // Should redirect to dashboard or home
    await expect(page).toHaveURL(/dashboard|home|\//i, { timeout: 10000 });
  });

  test('should login with valid credentials', async ({ page }) => {
    // First register a user
    await page.goto('/register');
    const loginEmail = `e2e_login_${Date.now()}@example.com`;
    const loginUsername = `e2elogin_${Date.now()}`;

    await page.fill('input[name="email"], input[type="email"]', loginEmail);
    await page.fill('input[name="username"]', loginUsername);
    await page.fill('input[name="password"], input[type="password"]', testPassword);

    const firstNameInput = page.locator('input[name="firstName"]');
    if (await firstNameInput.isVisible()) {
      await firstNameInput.fill('E2E');
    }

    const termsCheckbox = page.locator('input[type="checkbox"]');
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }

    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Log out
    const menuButton = page.locator('[aria-label="menu"], [data-testid="user-menu"], button:has-text("account")').first();
    if (await menuButton.isVisible()) {
      await menuButton.click();
      const logoutButton = page.locator('text=/log out|sign out|logout/i');
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
      }
    }

    // Now login
    await page.goto('/login');
    await page.fill('input[name="email"], input[type="email"]', loginEmail);
    await page.fill('input[name="password"], input[type="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Should be logged in
    await expect(page).toHaveURL(/dashboard|home|\//i, { timeout: 10000 });
  });

  test('should show error for invalid login credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"], input[type="email"]', 'nonexistent@example.com');
    await page.fill('input[name="password"], input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=/invalid|incorrect|error|failed/i')).toBeVisible({ timeout: 5000 });
  });
});
