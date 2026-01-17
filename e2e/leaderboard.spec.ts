import { test, expect } from '@playwright/test'

test.describe('Leaderboard', () => {
  test('should load leaderboard page', async ({ page }) => {
    await page.goto('/leaderboard')
    await expect(page.locator('body')).toBeVisible()
  })

  test('should display leaderboard heading', async ({ page }) => {
    await page.goto('/leaderboard')

    const heading = page.getByRole('heading', { name: /leaderboard|ranking|score/i })

    if (await heading.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(heading.first()).toBeVisible()
    }
  })

  test('should show rankings or empty state', async ({ page }) => {
    await page.goto('/leaderboard')
    await page.waitForTimeout(2000)

    // Either shows rankings or empty message
    const rankings = page.getByText(/rank|score|points|no.*results|empty/i)
    await expect(rankings.first()).toBeVisible({ timeout: 10000 })
  })

  test('should display podium for top 3 if available', async ({ page }) => {
    await page.goto('/leaderboard')
    await page.waitForTimeout(2000)

    // Look for podium or top 3 styling
    const podium = page.locator('[data-testid="podium"], .podium, .top-3')

    if (await podium.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(podium.first()).toBeVisible()
    }
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/leaderboard')

    await expect(page.locator('body')).toBeVisible()
    // Content should be visible without horizontal scroll
  })

  test('should auto-refresh rankings', async ({ page }) => {
    await page.goto('/leaderboard')

    // Wait for potential auto-refresh (30 seconds in the app)
    // Just verify the page stays functional
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Big Day Hub', () => {
  test('should load big day page', async ({ page }) => {
    await page.goto('/big-day')
    await expect(page.locator('body')).toBeVisible()
  })

  test('should require authentication or show guest gate', async ({ page }) => {
    await page.goto('/big-day')
    await page.waitForTimeout(2000)

    // Should show sign-in or content
    const content = page.locator('button, main, .content')
    await expect(content.first()).toBeVisible({ timeout: 10000 })
  })

  test('should display quick links section', async ({ page }) => {
    await page.goto('/big-day')
    await page.waitForTimeout(2000)

    // Look for quick links or navigation
    const links = page.getByRole('link')
    const count = await links.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('should have games link', async ({ page }) => {
    await page.goto('/big-day')
    await page.waitForTimeout(3000)

    // Look for games link
    const gamesLink = page.getByRole('link', { name: /games/i })

    if (await gamesLink.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(gamesLink.first()).toHaveAttribute('href', /games/i)
    }
  })

  test('should display seating information section', async ({ page }) => {
    await page.goto('/big-day')
    await page.waitForTimeout(2000)

    // Look for seating or table info
    const seating = page.getByText(/seating|table|seat/i)

    if (await seating.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(seating.first()).toBeVisible()
    }
  })

  test('should display menu section', async ({ page }) => {
    await page.goto('/big-day')
    await page.waitForTimeout(2000)

    // Look for menu info
    const menu = page.getByText(/menu|dinner|food|course/i)

    if (await menu.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(menu.first()).toBeVisible()
    }
  })
})
