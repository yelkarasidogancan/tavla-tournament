export type TournamentStatus = 'draft' | 'published' | 'completed'
export type MatchStage = 'group' | 'knockout'
export type MatchStatus = 'pending' | 'completed'

export interface Tournament {
  id: string
  name: string
  status: TournamentStatus
  group_size: number
  advances_per_group: number
  tournament_date: string | null
  location: string | null
  created_at: string
}

export interface Player {
  id: string
  tournament_id: string
  name: string
  avatar_seed: string
  created_at: string
}

export interface Group {
  id: string
  tournament_id: string
  name: string
}

export interface GroupPlayer {
  group_id: string
  player_id: string
  wins: number
  losses: number
  score_for: number
  score_against: number
  points: number
  position: number | null
  player?: Player
}

export interface Match {
  id: string
  tournament_id: string
  group_id: string | null
  round: string
  match_number: number
  player1_id: string | null
  player2_id: string | null
  score1: number | null
  score2: number | null
  winner_id: string | null
  stage: MatchStage
  status: MatchStatus
  next_match_id: string | null
  next_match_slot: 1 | 2 | null
  loser_next_match_id: string | null
  loser_next_match_slot: 1 | 2 | null
  player1?: Player
  player2?: Player
  winner?: Player
  group?: Group
}

export interface GroupWithPlayers extends Group {
  group_players: (GroupPlayer & { player: Player })[]
  matches: Match[]
}

export interface BracketMatch {
  id: string
  round: string
  match_number: number
  player1: Player | null
  player2: Player | null
  score1: number | null
  score2: number | null
  winner: Player | null
  status: MatchStatus
}

export interface Registration {
  id: string
  tournament_id: string
  name: string
  apartment: string
  added_to_tournament: boolean
  created_at: string
}

export interface BracketRound {
  name: string
  matches: BracketMatch[]
}
