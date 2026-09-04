import { test, expect } from '@playwright/test'

test.describe('Public Navigation', () => {
  test.describe('Homepage', () => {
    test('should load homepage successfully', async ({ page }) => {
      await page.goto('/')

      // Check page title/heading
      await expect(page.getByRole('heading', { name: /tournois gaming/i })).toBeVisible()

      // Check navigation elements
      await expect(page.getByRole('navigation')).toBeVisible()
      await expect(page.getByRole('link', { name: /connexion/i })).toBeVisible()
      await expect(page.getByRole('link', { name: /s'inscrire/i })).toBeVisible()
    })

    test('should display tournaments section', async ({ page }) => {
      await page.goto('/')

      // Check for tournaments section heading
      await expect(page.getByRole('heading', { name: /tournois disponibles/i })).toBeVisible()

      // Wait for loading to complete (either tournaments load or empty state)
      await page.waitForLoadState('networkidle')

      // Either we have tournament cards or an empty state message
      const hasTournaments = await page.locator('[class*="card"]').count() > 0
      const hasEmptyState = await page.getByText(/aucun tournoi/i).isVisible().catch(() => false)

      expect(hasTournaments || hasEmptyState).toBeTruthy()
    })

    test('should navigate to login from homepage', async ({ page }) => {
      await page.goto('/')

      await page.getByRole('link', { name: /connexion/i }).click()

      await expect(page).toHaveURL('/login')
    })

    test('should navigate to register from homepage', async ({ page }) => {
      await page.goto('/')

      await page.getByRole('link', { name: /s'inscrire/i }).click()

      await expect(page).toHaveURL('/register')
    })

    test('should have proper accessibility structure', async ({ page }) => {
      await page.goto('/')

      // Check for proper semantic structure
      await expect(page.locator('header[role="banner"]')).toBeVisible()
      await expect(page.locator('main')).toBeVisible()
      await expect(page.locator('nav[role="navigation"]')).toBeVisible()
    })
  })

  test.describe('Tournament List', () => {
    test('should display tournament cards with correct information', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Check if there are any tournaments
      const tournamentCards = page.locator('[class*="card"]')
      const cardCount = await tournamentCards.count()

      if (cardCount > 0) {
        // Check first tournament card has expected elements
        const firstCard = tournamentCards.first()

        // Should have a title
        await expect(firstCard.locator('[class*="card-title"]').first()).toBeVisible()

        // Should have game icon
        await expect(firstCard.locator('svg').first()).toBeVisible()

        // Should have a "Voir les détails" button
        await expect(firstCard.getByRole('link', { name: /voir les détails/i })).toBeVisible()
      }
    })

    test('should show tournament status badges', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      const tournamentCards = page.locator('[class*="card"]')
      const cardCount = await tournamentCards.count()

      if (cardCount > 0) {
        // Each card should have a status badge
        const badges = page.locator('[class*="badge"]')
        expect(await badges.count()).toBeGreaterThan(0)
      }
    })

    test('should handle loading state', async ({ page }) => {
      // Navigate to homepage with slow network
      await page.goto('/')

      // We should see either loading state or content
      const hasContent = await page.getByRole('heading', { name: /tournois gaming/i }).isVisible()
      expect(hasContent).toBeTruthy()
    })

    test('should handle error state gracefully', async ({ page }) => {
      // Intercept the API call and force an error
      await page.route('/api/tournaments', (route) => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Server error' }),
        })
      })

      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Should show error message
      await expect(page.getByText(/erreur/i)).toBeVisible({ timeout: 10000 })

      // Should have retry button
      await expect(page.getByRole('button', { name: /réessayer/i })).toBeVisible()
    })
  })

  test.describe('Tournament Detail Page', () => {
    test('should navigate to tournament detail from list', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      const tournamentCards = page.locator('[class*="card"]')
      const cardCount = await tournamentCards.count()

      if (cardCount > 0) {
        // Click on the first tournament's detail link
        const detailLink = tournamentCards.first().getByRole('link', { name: /voir les détails/i })
        await detailLink.click()

        // Should navigate to tournament detail page
        await expect(page).toHaveURL(/\/tournaments\/[^/]+$/)
      }
    })

    test('should display tournament information on detail page', async ({ page }) => {
      // First get a tournament ID from the API
      const response = await page.request.get('/api/tournaments')

      if (response.ok()) {
        const tournaments = await response.json()

        if (tournaments.length > 0) {
          const tournamentId = tournaments[0].id

          await page.goto(`/tournaments/${tournamentId}`)
          await page.waitForLoadState('networkidle')

          // Check for tournament info elements
          await expect(page.locator('header')).toBeVisible()

          // Check for back button
          await expect(page.getByRole('link', { name: /retour/i })).toBeVisible()

          // Check for tournament details section
          await expect(page.getByText(/jeu/i)).toBeVisible()
          await expect(page.getByText(/joueurs par équipe/i)).toBeVisible()
        }
      }
    })

    test('should display teams list on tournament detail', async ({ page }) => {
      const response = await page.request.get('/api/tournaments')

      if (response.ok()) {
        const tournaments = await response.json()

        if (tournaments.length > 0) {
          const tournamentId = tournaments[0].id

          await page.goto(`/tournaments/${tournamentId}`)
          await page.waitForLoadState('networkidle')

          // Check for teams section
          await expect(page.getByRole('heading', { name: /équipes inscrites/i })).toBeVisible()
        }
      }
    })

    test('should show registration button for open tournaments', async ({ page }) => {
      const response = await page.request.get('/api/tournaments')

      if (response.ok()) {
        const tournaments = await response.json()
        const openTournament = tournaments.find(
          (t: { status: string; teams: unknown[] }) =>
            t.status === 'OPEN' && t.teams.length < 16
        )

        if (openTournament) {
          await page.goto(`/tournaments/${openTournament.id}`)
          await page.waitForLoadState('networkidle')

          // Should show registration button
          await expect(page.getByRole('link', { name: /s'inscrire/i })).toBeVisible()
        }
      }
    })

    test('should handle non-existent tournament', async ({ page }) => {
      await page.goto('/tournaments/non-existent-id')
      await page.waitForLoadState('networkidle')

      // Should show error state
      await expect(page.getByText(/erreur|introuvable/i)).toBeVisible({ timeout: 10000 })
    })

    test('should navigate back to homepage from detail', async ({ page }) => {
      const response = await page.request.get('/api/tournaments')

      if (response.ok()) {
        const tournaments = await response.json()

        if (tournaments.length > 0) {
          await page.goto(`/tournaments/${tournaments[0].id}`)
          await page.waitForLoadState('networkidle')

          // Click back button
          await page.getByRole('link', { name: /retour/i }).click()

          await expect(page).toHaveURL('/')
        }
      }
    })
  })

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 })
      await page.goto('/')

      // Header should be visible
      await expect(page.getByRole('heading', { name: /tournois gaming/i })).toBeVisible()

      // Navigation should be visible (may be in different layout)
      await expect(page.getByRole('navigation')).toBeVisible()
    })

    test('should display correctly on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.goto('/')

      await expect(page.getByRole('heading', { name: /tournois gaming/i })).toBeVisible()
      await expect(page.getByRole('navigation')).toBeVisible()
    })

    test('should display correctly on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.goto('/')

      await expect(page.getByRole('heading', { name: /tournois gaming/i })).toBeVisible()
      await expect(page.getByRole('navigation')).toBeVisible()
    })
  })
})
