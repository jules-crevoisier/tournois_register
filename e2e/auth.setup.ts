import { test as setup, expect } from '@playwright/test'
import { testUsers, generateTestEmail } from './fixtures/test-data'

const STORAGE_STATE_PATH = 'e2e/.auth/user.json'

setup('authenticate as test user', async ({ page }) => {
  // Generate a unique email for this test run to avoid conflicts
  const uniqueEmail = generateTestEmail()
  const password = testUsers.player.password
  const name = testUsers.player.name

  // First, register a new user
  await page.goto('/register')
  await expect(page.getByRole('heading', { name: /inscription/i })).toBeVisible()

  // Fill registration form
  await page.getByLabel(/nom/i).fill(name)
  await page.getByLabel(/email/i).fill(uniqueEmail)
  await page.getByLabel(/^mot de passe$/i).fill(password)
  await page.getByLabel(/confirmer/i).fill(password)

  // Submit registration (button text is "Creer le compte")
  await page.getByRole('button', { name: /creer/i }).click()

  // Wait for redirect to homepage after successful registration and auto-login
  await expect(page).toHaveURL('/', { timeout: 15000 })

  // Save authentication state for reuse in tests
  await page.context().storageState({ path: STORAGE_STATE_PATH })
})
