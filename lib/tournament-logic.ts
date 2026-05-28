import { Player, Group, Match } from './types'

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function createGroups(players: Player[], groupSize: number): Player[][] {
  const shuffled = shuffleArray(players)
  const groups: Player[][] = []
  for (let i = 0; i < shuffled.length; i += groupSize) {
    groups.push(shuffled.slice(i, i + groupSize))
  }
  return groups
}

export function generateRoundRobinFixtures(players: Player[]): [Player, Player][] {
  const fixtures: [Player, Player][] = []
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      fixtures.push([players[i], players[j]])
    }
  }
  return fixtures
}

export function generateGroupName(index: number): string {
  return String.fromCharCode(65 + index)
}

export function getKnockoutRoundName(playersLeft: number): string {
  switch (playersLeft) {
    case 2: return 'Final'
    case 4: return 'Yarı Final'
    case 8: return 'Çeyrek Final'
    case 16: return '16\'lı Tur'
    case 32: return '32\'li Tur'
    default: return `${playersLeft}'li Tur`
  }
}

export function generateKnockoutBracket(
  advancingPlayers: { player: Player; groupName: string; position: number }[]
): { player1Id: string; player2Id: string; matchNumber: number; round: string }[] {
  if (advancingPlayers.length === 0) return []

  const maxPosition = Math.max(...advancingPlayers.map(p => p.position))
  const pairs: { player1Id: string; player2Id: string }[] = []

  // Eşleştirme: pozisyon 1 vs 2, 3 vs 4, ... çapraz grup seeding ile
  // (1A vs 2B, 1B vs 2A gibi; 3 ve üstü pozisyonlar için de aynı mantık)
  for (let pos = 1; pos <= maxPosition; pos += 2) {
    const higherPos = advancingPlayers
      .filter(p => p.position === pos)
      .sort((a, b) => a.groupName.localeCompare(b.groupName))
    const lowerPos = advancingPlayers
      .filter(p => p.position === pos + 1)
      .sort((a, b) => a.groupName.localeCompare(b.groupName))

    const count = Math.min(higherPos.length, lowerPos.length)
    for (let i = 0; i < count; i++) {
      pairs.push({
        player1Id: higherPos[i].player.id,
        // Çapraz eşleştirme: pos+1 grubundan karşı uç
        player2Id: lowerPos[count - 1 - i].player.id,
      })
    }
  }

  // Gerçekte eşleştirilen oyuncu sayısına göre tur adını belirle
  const totalPlayers = pairs.length * 2
  const roundName = getKnockoutRoundName(totalPlayers)

  return pairs.map((pair, i) => ({
    ...pair,
    matchNumber: i + 1,
    round: roundName,
  }))
}

export interface StandingRow {
  playerId: string
  wins: number
  losses: number
  scoreFor: number
  scoreAgainst: number
  points: number
}

/**
 * Tek kaynak sıralama kuralı:
 *   1. Puan (fazla olan öne)
 *   2. Averaj = scoreFor - scoreAgainst (büyük fark öne)
 *   3. scoreFor (daha çok puan yapan öne — üçüncü kriter)
 */
export function compareStandings(a: StandingRow, b: StandingRow): number {
  if (b.points !== a.points) return b.points - a.points
  const diffA = a.scoreFor - a.scoreAgainst
  const diffB = b.scoreFor - b.scoreAgainst
  if (diffB !== diffA) return diffB - diffA
  return b.scoreFor - a.scoreFor
}

export function calculateGroupStandings(
  players: Player[],
  matches: Match[]
): StandingRow[] {
  const standings: StandingRow[] = players.map(p => ({
    playerId: p.id,
    wins: 0,
    losses: 0,
    scoreFor: 0,
    scoreAgainst: 0,
    points: 0,
  }))

  for (const match of matches) {
    if (match.status !== 'completed' || match.score1 === null || match.score2 === null) continue

    const p1 = standings.find(s => s.playerId === match.player1_id)
    const p2 = standings.find(s => s.playerId === match.player2_id)
    if (!p1 || !p2) continue

    p1.scoreFor += match.score1
    p1.scoreAgainst += match.score2
    p2.scoreFor += match.score2
    p2.scoreAgainst += match.score1

    if (match.winner_id === match.player1_id) {
      p1.wins++
      p1.points += 1
      p2.losses++
    } else if (match.winner_id === match.player2_id) {
      p2.wins++
      p2.points += 1
      p1.losses++
    }
  }

  return standings.sort(compareStandings)
}
