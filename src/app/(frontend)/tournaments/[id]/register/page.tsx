import RegistrationForm from "@/components/RegistrationForm"

// Mock tournament data - will be replaced with actual API call
const tournament = {
  id: "1",
  title: "League of Legends Championship",
  game: "League of Legends",
  playersPerTeam: 5,
  maxTeams: 16,
  teamsCount: 8,
}

export default function TournamentRegister({ params: { id } }: { params: { id: string } }) {
  return <RegistrationForm tournament={tournament} />
}
