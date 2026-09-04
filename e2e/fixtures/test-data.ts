/**
 * Test data fixtures for E2E tests
 * These are used to seed the database and create consistent test scenarios
 */

export const testUsers = {
  player: {
    name: 'Test Player',
    email: 'player@test.com',
    password: 'TestPassword123!',
    role: 'PLAYER',
  },
  organizer: {
    name: 'Test Organizer',
    email: 'organizer@test.com',
    password: 'OrganizerPass123!',
    role: 'ORGANIZER',
  },
  admin: {
    name: 'Test Admin',
    email: 'admin@test.com',
    password: 'AdminPass123!',
    role: 'ADMIN',
  },
} as const

export const testTournaments = {
  openSolo: {
    title: 'Solo Championship',
    description: 'A solo gaming tournament for all skill levels',
    game: 'League of Legends',
    playersPerTeam: 1,
    maxTeams: 16,
    status: 'OPEN',
    mode: 'SINGLE_ELIMINATION',
  },
  openTeam: {
    title: 'Team Championship',
    description: 'A 5v5 team tournament',
    game: 'Valorant',
    playersPerTeam: 5,
    maxTeams: 8,
    status: 'OPEN',
    mode: 'SINGLE_ELIMINATION',
  },
  closedTournament: {
    title: 'Closed Tournament',
    description: 'This tournament is no longer accepting registrations',
    game: 'CS2',
    playersPerTeam: 5,
    maxTeams: 4,
    status: 'CLOSED',
    mode: 'SINGLE_ELIMINATION',
  },
  draftTournament: {
    title: 'Upcoming Tournament',
    description: 'Coming soon',
    game: 'Fortnite',
    playersPerTeam: 1,
    maxTeams: 32,
    status: 'DRAFT',
    mode: 'SINGLE_ELIMINATION',
  },
} as const

export const testTeam = {
  teamName: 'Test Team Alpha',
  players: [
    {
      playerName: 'Player One',
      gameUsername: 'player1_game',
      discordUsername: 'player1#1234',
    },
    {
      playerName: 'Player Two',
      gameUsername: 'player2_game',
      discordUsername: 'player2#5678',
    },
  ],
} as const

/**
 * Generate a unique email for test registration
 */
export function generateTestEmail(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(7)
  return `test_${timestamp}_${random}@test.com`
}

/**
 * Generate future dates for tournament testing
 */
export function generateTournamentDates() {
  const now = new Date()
  const startDate = new Date(now)
  startDate.setDate(startDate.getDate() + 7)

  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + 1)

  const registrationDeadline = new Date(startDate)
  registrationDeadline.setDate(registrationDeadline.getDate() - 1)

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    registrationDeadline: registrationDeadline.toISOString(),
  }
}
