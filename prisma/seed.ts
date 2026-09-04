import { PrismaClient, TournamentStatus, UserRole, TournamentMode } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')

  // Create test users
  const hashedPassword = await bcrypt.hash('TestPassword123!', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      name: 'Test Admin',
      password: hashedPassword,
      role: UserRole.ADMIN,
    },
  })

  const organizer = await prisma.user.upsert({
    where: { email: 'organizer@test.com' },
    update: {},
    create: {
      email: 'organizer@test.com',
      name: 'Test Organizer',
      password: hashedPassword,
      role: UserRole.ORGANIZER,
    },
  })

  const player = await prisma.user.upsert({
    where: { email: 'player@test.com' },
    update: {},
    create: {
      email: 'player@test.com',
      name: 'Test Player',
      password: hashedPassword,
      role: UserRole.PLAYER,
    },
  })

  console.log('Created users:', { admin: admin.email, organizer: organizer.email, player: player.email })

  // Create test tournaments
  const now = new Date()
  const futureDate = (days: number) => {
    const date = new Date(now)
    date.setDate(date.getDate() + days)
    return date
  }
  const pastDate = (days: number) => {
    const date = new Date(now)
    date.setDate(date.getDate() - days)
    return date
  }

  // Open Solo Tournament
  const soloTournament = await prisma.tournament.upsert({
    where: { id: 'solo-championship-test' },
    update: {},
    create: {
      id: 'solo-championship-test',
      title: 'Solo Championship',
      description: 'A solo gaming tournament for all skill levels. Compete against the best players!',
      game: 'League of Legends',
      mode: TournamentMode.SINGLE_ELIMINATION,
      playersPerTeam: 1,
      maxTeams: 16,
      startDate: futureDate(14),
      endDate: futureDate(15),
      registrationDeadline: futureDate(7),
      status: TournamentStatus.OPEN,
      createdById: organizer.id,
    },
  })

  // Open Team Tournament
  const teamTournament = await prisma.tournament.upsert({
    where: { id: 'team-championship-test' },
    update: {},
    create: {
      id: 'team-championship-test',
      title: 'Team Championship 5v5',
      description: 'A 5v5 team tournament for competitive players. Assemble your squad!',
      game: 'Valorant',
      mode: TournamentMode.SINGLE_ELIMINATION,
      playersPerTeam: 5,
      maxTeams: 8,
      startDate: futureDate(21),
      endDate: futureDate(22),
      registrationDeadline: futureDate(14),
      status: TournamentStatus.OPEN,
      createdById: organizer.id,
    },
  })

  // Closed Tournament
  const closedTournament = await prisma.tournament.upsert({
    where: { id: 'closed-tournament-test' },
    update: {},
    create: {
      id: 'closed-tournament-test',
      title: 'CS2 Pro League',
      description: 'This tournament registration is closed.',
      game: 'CS2',
      mode: TournamentMode.SINGLE_ELIMINATION,
      playersPerTeam: 5,
      maxTeams: 4,
      startDate: futureDate(3),
      endDate: futureDate(4),
      registrationDeadline: pastDate(1),
      status: TournamentStatus.CLOSED,
      createdById: admin.id,
    },
  })

  // Ongoing Tournament
  const ongoingTournament = await prisma.tournament.upsert({
    where: { id: 'ongoing-tournament-test' },
    update: {},
    create: {
      id: 'ongoing-tournament-test',
      title: 'Fortnite Battle Royale',
      description: 'Tournament currently in progress.',
      game: 'Fortnite',
      mode: TournamentMode.SINGLE_ELIMINATION,
      playersPerTeam: 1,
      maxTeams: 32,
      startDate: pastDate(1),
      endDate: futureDate(1),
      registrationDeadline: pastDate(3),
      status: TournamentStatus.ONGOING,
      createdById: organizer.id,
    },
  })

  // Draft Tournament
  const draftTournament = await prisma.tournament.upsert({
    where: { id: 'draft-tournament-test' },
    update: {},
    create: {
      id: 'draft-tournament-test',
      title: 'Upcoming Rocket League Cup',
      description: 'Coming soon - this tournament is still being prepared.',
      game: 'Rocket League',
      mode: TournamentMode.DOUBLE_ELIMINATION,
      playersPerTeam: 3,
      maxTeams: 16,
      startDate: futureDate(30),
      endDate: futureDate(31),
      registrationDeadline: futureDate(25),
      status: TournamentStatus.DRAFT,
      createdById: admin.id,
    },
  })

  console.log('Created tournaments:', {
    solo: soloTournament.title,
    team: teamTournament.title,
    closed: closedTournament.title,
    ongoing: ongoingTournament.title,
    draft: draftTournament.title,
  })

  // Create a sample team for the solo tournament
  await prisma.team.upsert({
    where: { id: 'sample-solo-team' },
    update: {},
    create: {
      id: 'sample-solo-team',
      teamName: 'Solo Champion',
      tournamentId: soloTournament.id,
      captainId: player.id,
      players: JSON.stringify([
        {
          playerName: 'Test Player',
          gameUsername: 'ProGamer123',
          discordUsername: 'progamer#1234',
        },
      ]),
      status: 'CONFIRMED',
    },
  })

  // Create a sample team for the team tournament
  await prisma.team.upsert({
    where: { id: 'sample-team-alpha' },
    update: {},
    create: {
      id: 'sample-team-alpha',
      teamName: 'Team Alpha',
      tournamentId: teamTournament.id,
      captainId: player.id,
      players: JSON.stringify([
        { playerName: 'Player One', gameUsername: 'alpha_one', discordUsername: 'alpha1#1111' },
        { playerName: 'Player Two', gameUsername: 'alpha_two', discordUsername: 'alpha2#2222' },
        { playerName: 'Player Three', gameUsername: 'alpha_three', discordUsername: 'alpha3#3333' },
        { playerName: 'Player Four', gameUsername: 'alpha_four', discordUsername: 'alpha4#4444' },
        { playerName: 'Player Five', gameUsername: 'alpha_five', discordUsername: 'alpha5#5555' },
      ]),
      status: 'CONFIRMED',
    },
  })

  console.log('Created sample teams')
  console.log('Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
