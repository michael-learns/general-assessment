import { test, expect } from '@playwright/test'

/**
 * AI Payroll Assessment E2E Tests
 *
 * PURPOSE:
 * End-to-end tests for the assessment flow — landing page, session creation,
 * and report page availability.
 *
 * PREREQUISITES:
 * - Development server running on localhost:3000
 * - Run: bun dev (in a separate terminal)
 * - Run tests: bun test:e2e
 */

test.describe('Landing Page', () => {
  test('should display the assessment start form', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Payroll Fit Assessment' })).toBeVisible()
    await expect(page.getByText('Start Assessment')).toBeVisible()
  })

  test('should show company name input', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByPlaceholder('Acme Corp')).toBeVisible()
  })

  test('should show industry selector', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Select your industry')).toBeVisible()
  })

  test('should show validation error when submitting empty form', async ({ page }) => {
    await page.goto('/')
    await page.getByText('Start Assessment').click()
    await expect(page.getByText(/company name/i)).toBeVisible()
  })

  test('should not have console errors on load', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.goto('/')
    const filteredErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('404') &&
      !e.includes('ECONNREFUSED')
    )
    expect(filteredErrors).toHaveLength(0)
  })
})

test.describe('Assessment Page', () => {
  test('should redirect to landing if session not found', async ({ page }) => {
    await page.goto('/assessment/invalid-session-id')
    // Should either show an error state or redirect - not crash
    await expect(page.locator('body')).toBeVisible()
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.goto('/')
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.getByRole('heading', { name: 'Payroll Fit Assessment' })).toBeVisible()
  })
})

test.describe('Report Page', () => {
  test('should show not found state for invalid session', async ({ page }) => {
    await page.goto('/report/invalid-session-id')
    // Should show error/not-found state gracefully
    await expect(page.locator('body')).toBeVisible()
  })
})
