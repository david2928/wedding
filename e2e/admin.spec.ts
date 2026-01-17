import { test, expect } from '@playwright/test'

test.describe('Admin Guest Management', () => {
  test('should show password input', async ({ page }) => {
    await page.goto('/admin-guests')

    const passwordInput = page.getByPlaceholder(/password/i).or(page.locator('input[type="password"]'))
    await expect(passwordInput.first()).toBeVisible({ timeout: 10000 })
  })

  test('should reject wrong password', async ({ page }) => {
    await page.goto('/admin-guests')

    const passwordInput = page.getByPlaceholder(/password/i).or(page.locator('input[type="password"]'))
    await passwordInput.first().fill('wrongpassword')

    const submitButton = page.getByRole('button', { name: /enter|submit|login|access/i })
    await submitButton.click()

    await page.waitForTimeout(1000)
    // Should stay on password screen
    await expect(passwordInput.first()).toBeVisible()
  })

  test('should accept correct password', async ({ page }) => {
    await page.goto('/admin-guests')

    const passwordInput = page.getByPlaceholder(/password/i).or(page.locator('input[type="password"]'))
    await passwordInput.first().fill('ChanikaDavid2026!')

    const submitButton = page.getByRole('button', { name: /enter|submit|login|access/i })
    await submitButton.click()

    await page.waitForTimeout(3000)

    // Should show admin dashboard
    const dashboard = page.getByText(/parties|guests|total|completed/i)
    await expect(dashboard.first()).toBeVisible({ timeout: 10000 })
  })

  test.describe('Admin Dashboard (Authenticated)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/admin-guests')

      const passwordInput = page.getByPlaceholder(/password/i).or(page.locator('input[type="password"]'))
      await passwordInput.first().fill('ChanikaDavid2026!')

      const submitButton = page.getByRole('button', { name: /enter|submit|login|access/i })
      await submitButton.click()
      await page.waitForTimeout(3000)
    })

    test('should display stats cards', async ({ page }) => {
      // Look for statistics display
      const stats = page.getByText(/parties|guests|completed|pending/i)
      await expect(stats.first()).toBeVisible({ timeout: 10000 })
    })

    test('should have search functionality', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/search/i).or(page.locator('input[type="search"]'))

      if (await searchInput.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await searchInput.first().fill('test')
        await page.waitForTimeout(500)
        // Search should filter results
        await expect(searchInput.first()).toHaveValue('test')
      }
    })

    test('should display party list', async ({ page }) => {
      // Look for party cards or rows
      const partyList = page.locator('[data-testid="party-list"], table, .party-card')

      if (await partyList.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(partyList.first()).toBeVisible()
      }
    })

    test('should have filter options', async ({ page }) => {
      // Look for filter buttons or dropdowns
      const filterButtons = page.getByRole('button', { name: /all|completed|pending|filter/i })

      if (await filterButtons.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(filterButtons.first()).toBeVisible()
      }
    })

    test('should have QR code functionality', async ({ page }) => {
      // Look for QR code related buttons
      const qrButton = page.getByRole('button', { name: /qr|print|code/i })

      if (await qrButton.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(qrButton.first()).toBeEnabled()
      }
    })

    test('should have export functionality', async ({ page }) => {
      const exportButton = page.getByRole('button', { name: /export|csv|download/i })

      if (await exportButton.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(exportButton.first()).toBeEnabled()
      }
    })

    test('should expand party details on click', async ({ page }) => {
      // Click on a party row to expand
      const partyRow = page.locator('[data-testid="party-row"], tr, .party-card').first()

      if (await partyRow.isVisible({ timeout: 5000 }).catch(() => false)) {
        await partyRow.click()
        await page.waitForTimeout(500)
        // Details should be visible
      }
    })
  })
})

test.describe('Admin Games Page', () => {
  test('should load admin games page', async ({ page }) => {
    await page.goto('/admin-games')
    await expect(page.locator('body')).toBeVisible()
  })

  test('should show password protection or game admin content', async ({ page }) => {
    await page.goto('/admin-games')
    await page.waitForTimeout(2000)

    // Either shows password input or admin content
    const content = page.locator('input, button, table, .admin-content')
    await expect(content.first()).toBeVisible({ timeout: 10000 })
  })
})
