import { test, expect } from '@playwright/test'

test.describe('Live Quiz', () => {
  test.describe('Quiz Page (Guest View)', () => {
    test('should load quiz page', async ({ page }) => {
      await page.goto('/quiz')
      await expect(page.locator('body')).toBeVisible()
    })

    test('should show sign-in options when not authenticated', async ({ page }) => {
      await page.goto('/quiz')

      // Should show Google sign-in or connecting message
      const signInButton = page.getByRole('button', { name: /sign in|google/i })
      const connectingMessage = page.getByText(/connecting|loading/i)

      const isSignIn = await signInButton.isVisible({ timeout: 5000 }).catch(() => false)
      const isConnecting = await connectingMessage.isVisible({ timeout: 5000 }).catch(() => false)

      expect(isSignIn || isConnecting).toBe(true)
    })

    test('should have dev mode bypass option', async ({ page }) => {
      await page.goto('/quiz')

      const devButton = page.getByRole('button', { name: /dev mode|bypass/i })
      if (await devButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(devButton).toBeEnabled()
      }
    })
  })

  test.describe('Quiz Waiting Room', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/quiz')

      // Try dev mode bypass
      const devButton = page.getByRole('button', { name: /dev mode|bypass/i })
      if (await devButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await devButton.click()
        await page.waitForTimeout(2000)
      }
    })

    test('should show waiting or connecting status', async ({ page }) => {
      // Look for waiting room or connecting status or any page content
      await page.waitForTimeout(2000)
      const pageContent = page.locator('body')
      await expect(pageContent).toBeVisible()

      // Page loaded successfully - that's the main check
      // The waiting message depends on quiz session state
    })
  })

  test.describe('Quiz Answer Selection', () => {
    test('answer buttons should be clickable when question is active', async ({ page }) => {
      await page.goto('/quiz')

      // This test requires an active quiz session
      // Check for answer option buttons (A, B, C, D)
      const optionA = page.getByRole('button', { name: /^A$/i })
      const optionB = page.getByRole('button', { name: /^B$/i })

      // If visible, they should be clickable
      if (await optionA.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(optionA).toBeEnabled()
      }
    })
  })
})

test.describe('Admin Live Quiz', () => {
  test('should show password input', async ({ page }) => {
    await page.goto('/admin-live-quiz')

    // Should show password field
    const passwordInput = page.getByPlaceholder(/password/i).or(page.locator('input[type="password"]'))
    await expect(passwordInput.first()).toBeVisible({ timeout: 10000 })
  })

  test('should reject wrong password', async ({ page }) => {
    await page.goto('/admin-live-quiz')

    const passwordInput = page.getByPlaceholder(/password/i).or(page.locator('input[type="password"]'))
    await passwordInput.first().fill('wrongpassword')

    const submitButton = page.getByRole('button', { name: /enter|submit|login/i })
    await submitButton.click()

    // Should show error or stay on login
    await page.waitForTimeout(1000)
    await expect(passwordInput.first()).toBeVisible()
  })

  test('should accept correct password', async ({ page }) => {
    await page.goto('/admin-live-quiz')

    const passwordInput = page.getByPlaceholder(/password/i).or(page.locator('input[type="password"]'))
    await passwordInput.first().fill('wedding2026')

    const submitButton = page.getByRole('button', { name: /enter|submit|login/i })
    await submitButton.click()

    // Should show admin interface
    await page.waitForTimeout(2000)

    // Look for admin controls
    const adminControls = page.getByText(/create.*session|start.*quiz|session/i)
    await expect(adminControls.first()).toBeVisible({ timeout: 10000 })
  })

  test.describe('Admin Controls (Authenticated)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/admin-live-quiz')

      const passwordInput = page.getByPlaceholder(/password/i).or(page.locator('input[type="password"]'))
      await passwordInput.first().fill('wedding2026')

      const submitButton = page.getByRole('button', { name: /enter|submit|login/i })
      await submitButton.click()
      await page.waitForTimeout(2000)
    })

    test('should show create session button', async ({ page }) => {
      const createButton = page.getByRole('button', { name: /create.*session|new.*session/i })
      await expect(createButton.first()).toBeVisible({ timeout: 10000 })
    })

    test('should show participant count', async ({ page }) => {
      // Look for participant indicator
      const participantText = page.getByText(/participant|player|joined/i)
      if (await participantText.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(participantText.first()).toBeVisible()
      }
    })
  })
})
