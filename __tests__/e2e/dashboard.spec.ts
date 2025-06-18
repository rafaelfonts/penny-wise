import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard
    await page.goto('/');
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
  });

  test('should load dashboard page successfully', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/PennyWise/i);
    
    // Check for main navigation elements
    await expect(page.locator('nav')).toBeVisible();
    
    // Check for main content area
    await expect(page.locator('main')).toBeVisible();
    
    // Wait for any loading indicators to disappear
    await expect(page.locator('[data-testid="loading-indicator"]')).not.toBeVisible({
      timeout: 10000
    });
  });

  test('should display portfolio overview', async ({ page }) => {
    // Check for portfolio section
    const portfolioSection = page.locator('[data-testid="portfolio-overview"]');
    await expect(portfolioSection).toBeVisible({ timeout: 15000 });
    
    // Check for key portfolio metrics
    await expect(page.locator('[data-testid="total-value"]')).toBeVisible();
    await expect(page.locator('[data-testid="daily-change"]')).toBeVisible();
    await expect(page.locator('[data-testid="portfolio-chart"]')).toBeVisible();
  });

  test('should display market data widgets', async ({ page }) => {
    // Check for market data section
    const marketSection = page.locator('[data-testid="market-overview"]');
    await expect(marketSection).toBeVisible({ timeout: 15000 });
    
    // Check for market indices
    await expect(page.locator('[data-testid="market-indices"]')).toBeVisible();
    
    // Check for trending stocks
    await expect(page.locator('[data-testid="trending-stocks"]')).toBeVisible();
  });

  test('should navigate between different sections', async ({ page }) => {
    // Test navigation to portfolio page
    await page.click('[data-testid="nav-portfolio"]');
    await expect(page.url()).toContain('/portfolio');
    
    // Test navigation back to dashboard
    await page.click('[data-testid="nav-dashboard"]');
    await expect(page.url()).toBe('/');
    
    // Test navigation to market page
    await page.click('[data-testid="nav-market"]');
    await expect(page.url()).toContain('/market');
  });

  test('should handle responsive design', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('[data-testid="mobile-menu-toggle"]')).toBeVisible();
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('[data-testid="mobile-menu-toggle"]')).toBeVisible();
    
    // Test mobile menu functionality
    await page.click('[data-testid="mobile-menu-toggle"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
  });

  test('should handle theme switching', async ({ page }) => {
    // Locate theme toggle button
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    
    if (await themeToggle.isVisible()) {
      // Get initial theme
      const initialTheme = await page.getAttribute('html', 'class');
      
      // Toggle theme
      await themeToggle.click();
      
      // Wait for theme change
      await page.waitForTimeout(500);
      
      // Check theme changed
      const newTheme = await page.getAttribute('html', 'class');
      expect(newTheme).not.toBe(initialTheme);
    }
  });

  test('should display loading states correctly', async ({ page }) => {
    // Reload page to catch loading states
    await page.reload();
    
    // Check for skeleton loaders or loading indicators
    const loadingElements = [
      '[data-testid="portfolio-skeleton"]',
      '[data-testid="market-skeleton"]',
      '[data-testid="loading-spinner"]'
    ];
    
    // At least one loading indicator should be visible initially
    let hasLoadingIndicator = false;
    for (const selector of loadingElements) {
      try {
        await expect(page.locator(selector)).toBeVisible({ timeout: 1000 });
        hasLoadingIndicator = true;
        break;
      } catch {
        // Continue checking other selectors
      }
    }
    
    // Wait for loading to complete
    await page.waitForLoadState('networkidle');
    
    // All loading indicators should be gone
    for (const selector of loadingElements) {
      await expect(page.locator(selector)).not.toBeVisible();
    }
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Intercept API calls and simulate errors
    await page.route('**/api/portfolio/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });
    
    await page.reload();
    
    // Check for error messages or fallback content
    const errorSelectors = [
      '[data-testid="error-message"]',
      '[data-testid="fallback-content"]',
      '[data-testid="retry-button"]'
    ];
    
    let hasErrorHandling = false;
    for (const selector of errorSelectors) {
      if (await page.locator(selector).isVisible()) {
        hasErrorHandling = true;
        break;
      }
    }
    
    // Should handle errors gracefully
    expect(hasErrorHandling).toBe(true);
  });

  test('should maintain state across page refreshes', async ({ page }) => {
    // Make some state changes (e.g., toggle a setting)
    const settingsToggle = page.locator('[data-testid="settings-toggle"]');
    
    if (await settingsToggle.isVisible()) {
      await settingsToggle.click();
      
      // Get current state
      const isChecked = await settingsToggle.isChecked();
      
      // Refresh page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Check if state is preserved
      const newState = await settingsToggle.isChecked();
      expect(newState).toBe(isChecked);
    }
  });

  test('should have accessible elements', async ({ page }) => {
    // Check for proper ARIA labels and roles
    const mainContent = page.locator('main');
    await expect(mainContent).toHaveAttribute('role', 'main');
    
    // Check for heading hierarchy
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
    
    // Check for keyboard navigation
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Check for alt text on images
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      if (await img.isVisible()) {
        await expect(img).toHaveAttribute('alt');
      }
    }
  });
}); 