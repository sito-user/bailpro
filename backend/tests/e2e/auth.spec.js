const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:5173';

// Generate unique email to avoid conflicts
const uniqueEmail = () => `test_${Date.now()}@gmail.com`;

test.describe('Authentication', () => {
  test('user can register a new account', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);

    await page.fill('input[type="text"]:first-of-type', 'Agence E2E Test');
    await page.fill('input[placeholder="Ex: M. Salloum"]', 'Admin E2E');
    await page.fill('input[type="email"]', uniqueEmail());
    await page.fill('input[type="password"]', 'Password123');

    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
    await expect(page.locator('.page-title')).toContainText('Tableau de bord');
  });

  test('user can login and logout', async ({ page }) => {
    const email = uniqueEmail();

    // Register first
    await page.goto(`${BASE_URL}/register`);
    await page.fill('input[type="text"]:first-of-type', 'Agence Login E2E');
    await page.fill('input[placeholder="Ex: M. Salloum"]', 'Admin Login');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'Password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });

    // Logout
    await page.click('.sidebar__logout');
    await expect(page).toHaveURL(/login/, { timeout: 5000 });

    // Login again
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'Password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
  });

  test('login fails with wrong password', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', 'inexistant@test.com');
    await page.fill('input[type="password"]', 'WrongPassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('.auth-form__error')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Properties', () => {
  test.beforeEach(async ({ page }) => {
    // Register and login
    await page.goto(`${BASE_URL}/register`);
    await page.fill('input[type="text"]:first-of-type', 'Agence Prop E2E');
    await page.fill('input[placeholder="Ex: M. Salloum"]', 'Admin Prop');
    await page.fill('input[type="email"]', uniqueEmail());
    await page.fill('input[type="password"]', 'Password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
  });

  test('user can add a property', async ({ page }) => {
    await page.goto(`${BASE_URL}/properties`);

    // Click add button
    await page.click('button:has-text("Ajouter")');

    // Fill form
    await page.fill('input[placeholder="Rue des Jardins, Cocody"]', 'Apt E2E Cocody Test');
    await page.fill('input[placeholder="Cocody, Marcory..."]', 'Cocody');
    await page.fill('input[placeholder="150000"]', '150000');

    await page.click('button:has-text("Enregistrer")');

    // Property should appear in list
    await expect(page.locator('text=Apt E2E Cocody Test')).toBeVisible({ timeout: 5000 });
  });
});
