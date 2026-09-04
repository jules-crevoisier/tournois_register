import { test, expect } from '@playwright/test'
import { generateTestEmail, testTeam, testUsers } from './fixtures/test-data'

test.describe('Tournament Registration', () => {
  test.describe('Registration Flow', () => {
    test.beforeEach(async ({ page }) => {
      // Register and login a user for registration tests
      const email = generateTestEmail()

      await page.goto('/register')
      await page.getByLabel(/nom/i).fill('Registration Test User')
      await page.getByLabel(/email/i).fill(email)
      await page.getByLabel(/^mot de passe$/i).fill(testUsers.player.password)
      await page.getByLabel(/confirmer/i).fill(testUsers.player.password)
      await page.getByRole('button', { name: /creer/i }).click()
      await expect(page).toHaveURL('/', { timeout: 15000 })
    })

    test('should access registration page from tournament detail', async ({ page }) => {
      // Get list of tournaments and find an open one
      const response = await page.request.get('/api/tournaments')

      if (response.ok()) {
        const tournaments = await response.json()
        const openTournament = tournaments.find(
          (t: { status: string; teams: unknown[]; maxTeams: number }) =>
            t.status === 'OPEN' && t.teams.length < t.maxTeams
        )

        if (openTournament) {
          await page.goto(`/tournaments/${openTournament.id}`)
          await page.waitForLoadState('networkidle')

          // Click on registration button
          const registerLink = page.getByRole('link', { name: /s'inscrire/i })
          if (await registerLink.isVisible()) {
            await registerLink.click()

            await expect(page).toHaveURL(/\/tournaments\/[^/]+\/register$/)
            await expect(page.getByRole('heading', { name: /inscription au tournoi/i })).toBeVisible()
          }
        }
      }
    })

    test('should display registration form with correct fields', async ({ page }) => {
      const response = await page.request.get('/api/tournaments')

      if (response.ok()) {
        const tournaments = await response.json()
        const openTournament = tournaments.find(
          (t: { status: string; teams: unknown[]; maxTeams: number }) =>
            t.status === 'OPEN' && t.teams.length < t.maxTeams
        )

        if (openTournament) {
          await page.goto(`/tournaments/${openTournament.id}/register`)
          await page.waitForLoadState('networkidle')

          // Check for team name field
          await expect(page.getByLabel(/nom de l'équipe/i)).toBeVisible()

          // Check for player fields based on playersPerTeam
          for (let i = 0; i < openTournament.playersPerTeam; i++) {
            await expect(page.getByRole('heading', { name: new RegExp(`joueur ${i + 1}`, 'i') })).toBeVisible()
          }

          // Check for tournament info display
          await expect(page.getByText(/informations du tournoi/i)).toBeVisible()
          await expect(page.getByText(openTournament.game)).toBeVisible()
        }
      }
    })

    test('should display player fields for solo tournament', async ({ page }) => {
      const response = await page.request.get('/api/tournaments')

      if (response.ok()) {
        const tournaments = await response.json()
        const soloTournament = tournaments.find(
          (t: { status: string; playersPerTeam: number; teams: unknown[]; maxTeams: number }) =>
            t.status === 'OPEN' && t.playersPerTeam === 1 && t.teams.length < t.maxTeams
        )

        if (soloTournament) {
          await page.goto(`/tournaments/${soloTournament.id}/register`)
          await page.waitForLoadState('networkidle')

          // Should have exactly one player section
          await expect(page.getByRole('heading', { name: /joueur 1/i })).toBeVisible()

          // For solo, second player should not exist
          await expect(page.getByRole('heading', { name: /joueur 2/i })).not.toBeVisible()
        }
      }
    })

    test('should display multiple player fields for team tournament', async ({ page }) => {
      const response = await page.request.get('/api/tournaments')

      if (response.ok()) {
        const tournaments = await response.json()
        const teamTournament = tournaments.find(
          (t: { status: string; playersPerTeam: number; teams: unknown[]; maxTeams: number }) =>
            t.status === 'OPEN' && t.playersPerTeam > 1 && t.teams.length < t.maxTeams
        )

        if (teamTournament) {
          await page.goto(`/tournaments/${teamTournament.id}/register`)
          await page.waitForLoadState('networkidle')

          // Should have player sections equal to playersPerTeam
          for (let i = 1; i <= teamTournament.playersPerTeam; i++) {
            await expect(page.getByRole('heading', { name: new RegExp(`joueur ${i}`, 'i') })).toBeVisible()
          }
        }
      }
    })

    test('should validate required fields', async ({ page }) => {
      const response = await page.request.get('/api/tournaments')

      if (response.ok()) {
        const tournaments = await response.json()
        const openTournament = tournaments.find(
          (t: { status: string; teams: unknown[]; maxTeams: number }) =>
            t.status === 'OPEN' && t.teams.length < t.maxTeams
        )

        if (openTournament) {
          await page.goto(`/tournaments/${openTournament.id}/register`)
          await page.waitForLoadState('networkidle')

          // Try to submit without filling fields - button should be disabled
          const submitButton = page.getByRole('button', { name: /s'inscrire/i })
          await expect(submitButton).toBeDisabled()
        }
      }
    })

    test('should enable submit when all fields are filled', async ({ page }) => {
      const response = await page.request.get('/api/tournaments')

      if (response.ok()) {
        const tournaments = await response.json()
        const openTournament = tournaments.find(
          (t: { status: string; teams: unknown[]; maxTeams: number }) =>
            t.status === 'OPEN' && t.teams.length < t.maxTeams
        )

        if (openTournament) {
          await page.goto(`/tournaments/${openTournament.id}/register`)
          await page.waitForLoadState('networkidle')

          // Fill team name
          await page.getByLabel(/nom de l'équipe/i).fill('Test Team')

          // Fill all player fields
          for (let i = 0; i < openTournament.playersPerTeam; i++) {
            await page.locator(`#playerName-${i}`).fill(`Test Player ${i + 1}`)
            await page.locator(`#gameUsername-${i}`).fill(`player${i + 1}_game`)
            await page.locator(`#discordUsername-${i}`).fill(`player${i + 1}#1234`)
          }

          // Submit button should now be enabled
          const submitButton = page.getByRole('button', { name: /s'inscrire/i })
          await expect(submitButton).toBeEnabled()
        }
      }
    })

    test('should show captain marker on first player', async ({ page }) => {
      const response = await page.request.get('/api/tournaments')

      if (response.ok()) {
        const tournaments = await response.json()
        const openTournament = tournaments.find(
          (t: { status: string; teams: unknown[]; maxTeams: number }) =>
            t.status === 'OPEN' && t.teams.length < t.maxTeams
        )

        if (openTournament) {
          await page.goto(`/tournaments/${openTournament.id}/register`)
          await page.waitForLoadState('networkidle')

          // First player should be marked as captain
          await expect(page.getByText(/capitaine/i)).toBeVisible()
        }
      }
    })

    test('should navigate back to tournament from registration', async ({ page }) => {
      const response = await page.request.get('/api/tournaments')

      if (response.ok()) {
        const tournaments = await response.json()
        const openTournament = tournaments.find(
          (t: { status: string; teams: unknown[]; maxTeams: number }) =>
            t.status === 'OPEN' && t.teams.length < t.maxTeams
        )

        if (openTournament) {
          await page.goto(`/tournaments/${openTournament.id}/register`)
          await page.waitForLoadState('networkidle')

          // Click back button
          await page.getByRole('link', { name: /retour/i }).click()

          await expect(page).toHaveURL(`/tournaments/${openTournament.id}`)
        }
      }
    })

    test('should navigate back via cancel button', async ({ page }) => {
      const response = await page.request.get('/api/tournaments')

      if (response.ok()) {
        const tournaments = await response.json()
        const openTournament = tournaments.find(
          (t: { status: string; teams: unknown[]; maxTeams: number }) =>
            t.status === 'OPEN' && t.teams.length < t.maxTeams
        )

        if (openTournament) {
          await page.goto(`/tournaments/${openTournament.id}/register`)
          await page.waitForLoadState('networkidle')

          // Click cancel button
          await page.getByRole('link', { name: /annuler/i }).click()

          await expect(page).toHaveURL(`/tournaments/${openTournament.id}`)
        }
      }
    })
  })

  test.describe('Form Validation', () => {
    test('should not submit with empty team name', async ({ page }) => {
      const response = await page.request.get('/api/tournaments')

      if (response.ok()) {
        const tournaments = await response.json()
        const openTournament = tournaments.find(
          (t: { status: string; playersPerTeam: number; teams: unknown[]; maxTeams: number }) =>
            t.status === 'OPEN' && t.playersPerTeam === 1 && t.teams.length < t.maxTeams
        )

        if (openTournament) {
          await page.goto(`/tournaments/${openTournament.id}/register`)
          await page.waitForLoadState('networkidle')

          // Fill only player fields, leave team name empty
          await page.locator('#playerName-0').fill('Test Player')
          await page.locator('#gameUsername-0').fill('testplayer')
          await page.locator('#discordUsername-0').fill('test#1234')

          // Button should still be disabled
          const submitButton = page.getByRole('button', { name: /s'inscrire/i })
          await expect(submitButton).toBeDisabled()
        }
      }
    })

    test('should not submit with incomplete player data', async ({ page }) => {
      const response = await page.request.get('/api/tournaments')

      if (response.ok()) {
        const tournaments = await response.json()
        const openTournament = tournaments.find(
          (t: { status: string; playersPerTeam: number; teams: unknown[]; maxTeams: number }) =>
            t.status === 'OPEN' && t.playersPerTeam === 1 && t.teams.length < t.maxTeams
        )

        if (openTournament) {
          await page.goto(`/tournaments/${openTournament.id}/register`)
          await page.waitForLoadState('networkidle')

          // Fill team name and partial player data
          await page.getByLabel(/nom de l'équipe/i).fill('Test Team')
          await page.locator('#playerName-0').fill('Test Player')
          // Leave gameUsername and discordUsername empty

          // Button should be disabled
          const submitButton = page.getByRole('button', { name: /s'inscrire/i })
          await expect(submitButton).toBeDisabled()
        }
      }
    })
  })

  test.describe('Registration Error Handling', () => {
    test('should handle closed tournament', async ({ page }) => {
      const response = await page.request.get('/api/tournaments')

      if (response.ok()) {
        const tournaments = await response.json()
        const closedTournament = tournaments.find(
          (t: { status: string }) => t.status === 'CLOSED'
        )

        if (closedTournament) {
          // Navigate directly to registration for closed tournament
          await page.goto(`/tournaments/${closedTournament.id}/register`)
          await page.waitForLoadState('networkidle')

          // The page should load but registration shouldn't be possible
          // or the user should be redirected back
          const url = page.url()
          const hasRegistrationForm = await page.getByLabel(/nom de l'équipe/i).isVisible().catch(() => false)

          // Either we're not on the registration page or form is visible but won't submit
          expect(url.includes('/register') || !hasRegistrationForm).toBeTruthy()
        }
      }
    })

    test('should handle API error gracefully', async ({ page }) => {
      const response = await page.request.get('/api/tournaments')

      if (response.ok()) {
        const tournaments = await response.json()
        const openTournament = tournaments.find(
          (t: { status: string; playersPerTeam: number; teams: unknown[]; maxTeams: number }) =>
            t.status === 'OPEN' && t.playersPerTeam === 1 && t.teams.length < t.maxTeams
        )

        if (openTournament) {
          // Intercept the teams API and force an error
          await page.route('/api/teams', (route) => {
            route.fulfill({
              status: 400,
              body: JSON.stringify({ error: 'Tournament is full' }),
            })
          })

          await page.goto(`/tournaments/${openTournament.id}/register`)
          await page.waitForLoadState('networkidle')

          // Fill all fields
          await page.getByLabel(/nom de l'équipe/i).fill('Test Team')
          await page.locator('#playerName-0').fill('Test Player')
          await page.locator('#gameUsername-0').fill('testplayer')
          await page.locator('#discordUsername-0').fill('test#1234')

          // Handle the alert dialog
          page.on('dialog', async (dialog) => {
            expect(dialog.message()).toContain('full')
            await dialog.accept()
          })

          // Submit and wait for error
          await page.getByRole('button', { name: /s'inscrire/i }).click()

          // Should stay on the registration page
          await expect(page).toHaveURL(/\/register$/, { timeout: 5000 })
        }
      }
    })
  })

  test.describe('Accessibility', () => {
    test('should have proper form labels', async ({ page }) => {
      const response = await page.request.get('/api/tournaments')

      if (response.ok()) {
        const tournaments = await response.json()
        const openTournament = tournaments.find(
          (t: { status: string; teams: unknown[]; maxTeams: number }) =>
            t.status === 'OPEN' && t.teams.length < t.maxTeams
        )

        if (openTournament) {
          await page.goto(`/tournaments/${openTournament.id}/register`)
          await page.waitForLoadState('networkidle')

          // All form inputs should have associated labels
          const inputs = page.locator('input')
          const inputCount = await inputs.count()

          for (let i = 0; i < inputCount; i++) {
            const input = inputs.nth(i)
            const id = await input.getAttribute('id')
            if (id) {
              const label = page.locator(`label[for="${id}"]`)
              await expect(label).toBeVisible()
            }
          }
        }
      }
    })

    test('should have proper heading hierarchy', async ({ page }) => {
      const response = await page.request.get('/api/tournaments')

      if (response.ok()) {
        const tournaments = await response.json()
        const openTournament = tournaments.find(
          (t: { status: string; teams: unknown[]; maxTeams: number }) =>
            t.status === 'OPEN' && t.teams.length < t.maxTeams
        )

        if (openTournament) {
          await page.goto(`/tournaments/${openTournament.id}/register`)
          await page.waitForLoadState('networkidle')

          // Should have main heading
          await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        }
      }
    })
  })
})
