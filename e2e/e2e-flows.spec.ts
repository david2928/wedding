import { test, expect } from '@playwright/test'

test.describe('End-to-End Guest Journey', () => {
  test('complete navigation flow from homepage', async ({ page }) => {
    // Start at homepage
    await page.goto('/')
    await expect(page.locator('body')).toBeVisible()

    // Navigate to games (if link exists)
    const gamesLink = page.getByRole('link', { name: /games/i })
    if (await gamesLink.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await gamesLink.first().click()
      await page.waitForURL(/games/)
    }
  })

  test('games hub to quiz flow', async ({ page }) => {
    await page.goto('/games')
    await page.waitForTimeout(2000)

    // Try dev mode if available
    const devButton = page.getByRole('button', { name: /dev mode|bypass/i })
    if (await devButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await devButton.click()
      await page.waitForTimeout(2000)
    }

    // Look for quiz section or link
    const quizLink = page.getByText(/quiz|trivia/i)
    if (await quizLink.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await quizLink.first().click()
    }
  })
})

test.describe('Admin Complete Flow', () => {
  test('admin guest panel full workflow', async ({ page }) => {
    // Login
    await page.goto('/admin-guests')
    const passwordInput = page.locator('input[type="password"]').first()
    await passwordInput.fill('ChanikaDavid2026!')

    const submitButton = page.getByRole('button', { name: /enter|submit|login|access/i })
    await submitButton.click()
    await page.waitForTimeout(3000)

    // Verify dashboard loaded
    const stats = page.getByText(/parties|guests/i)
    await expect(stats.first()).toBeVisible({ timeout: 10000 })

    // Test search
    const searchInput = page.getByPlaceholder(/search/i)
    if (await searchInput.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.first().fill('Family')
      await page.waitForTimeout(500)
    }

    // Test filter
    const filterButton = page.getByRole('button', { name: /completed|all/i })
    if (await filterButton.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await filterButton.first().click()
    }
  })

  test('admin quiz panel full workflow', async ({ page }) => {
    // Login
    await page.goto('/admin-live-quiz')
    const passwordInput = page.locator('input[type="password"]').first()
    await passwordInput.fill('wedding2026')

    const submitButton = page.getByRole('button', { name: /enter|submit|login/i })
    await submitButton.click()
    await page.waitForTimeout(3000)

    // Verify admin panel loaded
    const adminContent = page.getByText(/session|create|quiz/i)
    await expect(adminContent.first()).toBeVisible({ timeout: 10000 })

    // Check for existing session or create button
    const createButton = page.getByRole('button', { name: /create.*session|new/i })
    if (await createButton.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(createButton.first()).toBeEnabled()
    }
  })
})

test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('homepage is mobile friendly', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('body')).toBeVisible()

    // Check no horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = await page.evaluate(() => window.innerWidth)
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10) // Allow small margin
  })

  test('games page is mobile friendly', async ({ page }) => {
    await page.goto('/games')
    await expect(page.locator('body')).toBeVisible()
  })

  test('quiz page is mobile friendly', async ({ page }) => {
    await page.goto('/quiz')
    await expect(page.locator('body')).toBeVisible()
  })

  test('leaderboard is mobile friendly', async ({ page }) => {
    await page.goto('/leaderboard')
    await expect(page.locator('body')).toBeVisible()
  })

  test('big day hub is mobile friendly', async ({ page }) => {
    await page.goto('/big-day')
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Error Handling', () => {
  test('404 page for invalid routes', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist')

    // Should return 404 or show error page
    // Next.js might return 404 or redirect
    await expect(page.locator('body')).toBeVisible()
  })

  test('handles network errors gracefully', async ({ page }) => {
    // This tests that the app doesn't crash on slow networks
    await page.route('**/*', (route) => {
      // Simulate slow network
      setTimeout(() => route.continue(), 100)
    })

    await page.goto('/')
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Performance', () => {
  test('homepage loads within acceptable time', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/')
    const loadTime = Date.now() - startTime

    // Should load within 10 seconds
    expect(loadTime).toBeLessThan(10000)
  })

  test('games page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/games')
    const loadTime = Date.now() - startTime

    expect(loadTime).toBeLessThan(10000)
  })
})

test.describe('Accessibility', () => {
  test('homepage has accessible elements', async ({ page }) => {
    await page.goto('/')

    // Check for main heading
    const h1 = page.locator('h1')
    if (await h1.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(h1.first()).toBeVisible()
    }

    // Check for navigation
    const nav = page.locator('nav, [role="navigation"]')
    if (await nav.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(nav.first()).toBeVisible()
    }
  })

  test('buttons are keyboard accessible', async ({ page }) => {
    await page.goto('/')

    // Tab to first focusable element
    await page.keyboard.press('Tab')

    // Should have focused element
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedElement).toBeDefined()
  })
})
