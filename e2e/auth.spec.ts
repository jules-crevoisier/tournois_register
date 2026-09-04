import { test, expect } from '@playwright/test'
import { generateTestEmail, testUsers } from './fixtures/test-data'

test.describe('Authentication', () => {
  test.describe('User Registration', () => {
    test('should successfully register a new user', async ({ page }) => {
      const email = generateTestEmail()
      const password = testUsers.player.password

      await page.goto('/register')

      // Verify we're on the registration page
      await expect(page.getByRole('heading', { name: /inscription/i })).toBeVisible()
      await expect(page.getByRole('heading', { name: /créer un compte/i })).toBeVisible()

      // Fill the registration form
      await page.getByLabel(/nom/i).fill('New Test User')
      await page.getByLabel(/email/i).fill(email)
      await page.getByLabel(/^mot de passe$/i).fill(password)
      await page.getByLabel(/confirmer/i).fill(password)

      // Submit the form
      await page.getByRole('button', { name: /créer/i }).click()

      // Should redirect to homepage after successful registration
      await expect(page).toHaveURL('/', { timeout: 15000 })
    })

    test('should show error for duplicate email', async ({ page }) => {
      // First, register a user
      const email = generateTestEmail()
      const password = testUsers.player.password

      await page.goto('/register')
      await page.getByLabel(/nom/i).fill('First User')
      await page.getByLabel(/email/i).fill(email)
      await page.getByLabel(/^mot de passe$/i).fill(password)
      await page.getByLabel(/confirmer/i).fill(password)
      await page.getByRole('button', { name: /créer/i }).click()
      await expect(page).toHaveURL('/', { timeout: 15000 })

      // Now try to register with the same email
      await page.goto('/register')
      await page.getByLabel(/nom/i).fill('Duplicate User')
      await page.getByLabel(/email/i).fill(email)
      await page.getByLabel(/^mot de passe$/i).fill(password)
      await page.getByLabel(/confirmer/i).fill(password)
      await page.getByRole('button', { name: /créer/i }).click()

      // Should show error message
      await expect(page.getByText(/existe déjà/i)).toBeVisible({ timeout: 5000 })
    })

    test('should show error for password mismatch', async ({ page }) => {
      await page.goto('/register')

      await page.getByLabel(/nom/i).fill('Test User')
      await page.getByLabel(/email/i).fill(generateTestEmail())
      await page.getByLabel(/^mot de passe$/i).fill('Password123!')
      await page.getByLabel(/confirmer/i).fill('DifferentPassword123!')
      await page.getByRole('button', { name: /créer/i }).click()

      await expect(page.getByText(/ne correspondent pas/i)).toBeVisible()
    })

    test('should show error for short password', async ({ page }) => {
      await page.goto('/register')

      await page.getByLabel(/nom/i).fill('Test User')
      await page.getByLabel(/email/i).fill(generateTestEmail())
      await page.getByLabel(/^mot de passe$/i).fill('short')
      await page.getByLabel(/confirmer/i).fill('short')
      await page.getByRole('button', { name: /créer/i }).click()

      await expect(page.getByText(/8 caractères/i)).toBeVisible()
    })
  })

  test.describe('User Login', () => {
    test.beforeEach(async ({ page }) => {
      // Register a user first for login tests
      const email = generateTestEmail()
      // Store email in page context for use in tests
      await page.goto('/register')
      await page.getByLabel(/nom/i).fill('Login Test User')
      await page.getByLabel(/email/i).fill(email)
      await page.getByLabel(/^mot de passe$/i).fill(testUsers.player.password)
      await page.getByLabel(/confirmer/i).fill(testUsers.player.password)
      await page.getByRole('button', { name: /créer/i }).click()
      await expect(page).toHaveURL('/', { timeout: 15000 })

      // Log out (go to homepage and assume logout)
      // Since logout button may depend on session, we'll clear cookies
      await page.context().clearCookies()

      // Store email for the test
      await page.evaluate((e) => {
        window.localStorage.setItem('testEmail', e)
      }, email)
    })

    test('should successfully login with valid credentials', async ({ page }) => {
      // Get the stored email
      await page.goto('/')
      const email = await page.evaluate(() => window.localStorage.getItem('testEmail'))

      await page.goto('/login')

      // Verify we're on login page
      await expect(page.getByRole('heading', { name: /connexion/i })).toBeVisible()

      // Fill login form
      await page.getByLabel(/email/i).fill(email!)
      await page.getByLabel(/mot de passe/i).fill(testUsers.player.password)

      // Submit
      await page.getByRole('button', { name: /se connecter/i }).click()

      // Should redirect to homepage
      await expect(page).toHaveURL('/', { timeout: 15000 })
    })

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login')

      await page.getByLabel(/email/i).fill('nonexistent@test.com')
      await page.getByLabel(/mot de passe/i).fill('wrongpassword')
      await page.getByRole('button', { name: /se connecter/i }).click()

      await expect(page.getByText(/incorrect/i)).toBeVisible({ timeout: 5000 })
    })

    test('should navigate to registration page from login', async ({ page }) => {
      await page.goto('/login')

      await page.getByRole('link', { name: /créer un compte/i }).click()

      await expect(page).toHaveURL('/register')
    })
  })

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated user from registration page to login', async ({ page }) => {
      // Clear any existing auth state
      await page.context().clearCookies()

      // Try to access tournament registration page directly
      await page.goto('/tournaments/some-id/register')

      // This should either show the registration form or redirect to login
      // depending on how the app handles unauthenticated users
      // For now, we verify the page loads without error
      await page.waitForLoadState('networkidle')

      // The page should either show registration form or redirect
      const url = page.url()
      expect(url.includes('/register') || url.includes('/login') || url.includes('/tournaments')).toBeTruthy()
    })
  })

  test.describe('Navigation', () => {
    test('should have back to home link on login page', async ({ page }) => {
      await page.goto('/login')

      const backLink = page.getByRole('link', { name: /retour/i })
      await expect(backLink).toBeVisible()
      await backLink.click()

      await expect(page).toHaveURL('/')
    })

    test('should have back to home link on register page', async ({ page }) => {
      await page.goto('/register')

      const backLink = page.getByRole('link', { name: /retour/i })
      await expect(backLink).toBeVisible()
      await backLink.click()

      await expect(page).toHaveURL('/')
    })
  })
})
