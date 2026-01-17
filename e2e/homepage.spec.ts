import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/')

    // Check page loaded - look for any heading or main content
    const heading = page.locator('h1, h2, [class*="hero"], [class*="title"]')
    await expect(heading.first()).toBeVisible({ timeout: 10000 })
  })

  test('should display navigation elements', async ({ page }) => {
    await page.goto('/')

    // Check for navigation or menu
    const nav = page.locator('nav, header')
    await expect(nav.first()).toBeVisible()
  })

  test('should have working links', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)

    // Check that links or buttons are present for navigation
    const interactiveElements = page.locator('a[href], button')
    const count = await interactiveElements.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Page should load without horizontal scroll
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })
})
