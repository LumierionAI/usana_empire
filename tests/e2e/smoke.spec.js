import { test, expect } from '@playwright/test';

test.describe('USANA Empire Smoke Tests', () => {
  
  test('System A: Landing page loads and contains required sections', async ({ page }) => {
    await page.goto('/');
    
    // Check Title
    await expect(page).toHaveTitle(/USANA Empire/);
    
    // Check global nav is mounted
    const nav = page.locator('.global-navbar');
    await expect(nav).toBeVisible();
    
    // Check that scroll snap sections are rendered (checking for the Hero CTA)
    const exploreBtn = page.locator('text=Explore Products');
    await expect(exploreBtn).toBeVisible();
  });

  test('System A: Product hub layout toggles', async ({ page }) => {
    await page.goto('/product/');
    
    // Initially Nutritionals should be visible
    const nutriView = page.locator('#view-nutritionals');
    await expect(nutriView).not.toHaveClass(/hidden/);
    
    // Switch to Celavive
    await page.click('button#btn-celavive');
    const celaView = page.locator('#view-celavive');
    await expect(celaView).not.toHaveClass(/hidden/);
    await expect(nutriView).toHaveClass(/hidden/);
  });

  test('System B: Tools hub loads securely', async ({ page }) => {
    await page.goto('/tools/');
    
    // Ensure all 5 tools are linked
    const links = page.locator('.tool-card');
    await expect(links).toHaveCount(5);
    
    await expect(page.locator('h2', { hasText: 'Financial Ledger' })).toBeVisible();
  });

});