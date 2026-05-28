import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { compareStandings } from '@/lib/tournament-logic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  // Sayıya zorla — JSON'dan string gelebilir
  const score1 = Number(body.score1)
  const score2 = Number(body.score2)

  if (!Number.isInteger(score1) || !Number.isInteger(score2) || score1 < 0 || score2 < 0) {
    return NextResponse.json({ error: 'Geçersiz skor' }, { status: 400 })
  }
  if (score1 === score2) {
    return NextResponse.json({ error: 'Beraberlik olamaz, birinin kazanması gerekiyor' }, { status: 400 })
  }

  const { data: match, error: fetchError } = await supabase
    .from('matches')
    .select('*, player1:players!matches_player1_id_fkey(*), player2:players!matches_player2_id_fkey(*)')
    .eq('id', id)
    .single()

  if (fetchError || !match) {
    return NextResponse.json({ error: 'Maç bulunamadı' }, { status: 404 })
  }

  const winnerId = score1 > score2 ? match.player1_id : match.player2_id

  const { data: updated, error } = await supabase
    .from('matches')
    .update({ score1, score2, winner_id: winnerId, status: 'completed' })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (match.stage === 'group' && match.group_id) {
    await updateGroupStandings(match.group_id)
  }

  if (match.stage === 'knockout' && match.next_match_id && match.next_match_slot) {
    // Sonraki maç zaten tamamlandıysa oyuncu slotunu değiştirme
    const { data: nextMatch } = await supabase
      .from('matches').select('status').eq('id', match.next_match_id).single()
    if (!nextMatch || nextMatch.status !== 'completed') {
      const updateField = match.next_match_slot === 1 ? 'player1_id' : 'player2_id'
      await supabase
        .from('matches')
        .update({ [updateField]: winnerId })
        .eq('id', match.next_match_id)
    }
  }

  // Kaybedeni 3. lük maçına yönlendir
  if (match.stage === 'knockout' && match.loser_next_match_id && match.loser_next_match_slot) {
    const { data: loserNextMatch } = await supabase
      .from('matches').select('status').eq('id', match.loser_next_match_id).single()
    if (!loserNextMatch || loserNextMatch.status !== 'completed') {
      const loserId = winnerId === match.player1_id ? match.player2_id : match.player1_id
      const loserField = match.loser_next_match_slot === 1 ? 'player1_id' : 'player2_id'
      await supabase
        .from('matches')
        .update({ [loserField]: loserId })
        .eq('id', match.loser_next_match_id)
    }
  }

  return NextResponse.json({ match: updated })
}

async function updateGroupStandings(groupId: string) {
  const { data: groupPlayers } = await supabase
    .from('group_players')
    .select('player_id')
    .eq('group_id', groupId)

  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .eq('group_id', groupId)
    .eq('status', 'completed')

  if (!groupPlayers || !matches) return

  const standings = groupPlayers.map(gp => ({
    playerId: gp.player_id,
    wins: 0, losses: 0, scoreFor: 0, scoreAgainst: 0, points: 0,
  }))

  for (const m of matches) {
    const p1 = standings.find(s => s.playerId === m.player1_id)
    const p2 = standings.find(s => s.playerId === m.player2_id)
    if (!p1 || !p2 || m.score1 === null || m.score2 === null) continue

    p1.scoreFor += Number(m.score1)
    p1.scoreAgainst += Number(m.score2)
    p2.scoreFor += Number(m.score2)
    p2.scoreAgainst += Number(m.score1)

    if (m.winner_id === m.player1_id) {
      p1.wins++
      p1.points += 1
      p2.losses++
    } else if (m.winner_id === m.player2_id) {
      p2.wins++
      p2.points += 1
      p1.losses++
    }
  }

  // Sıralama: lib'deki tek kaynak fonksiyon
  standings.sort(compareStandings)

  for (let i = 0; i < standings.length; i++) {
    const s = standings[i]
    await supabase.from('group_players').update({
      wins: s.wins,
      losses: s.losses,
      score_for: s.scoreFor,
      score_against: s.scoreAgainst,
      points: s.points,
      position: i + 1,
    }).eq('group_id', groupId).eq('player_id', s.playerId)
  }
}
