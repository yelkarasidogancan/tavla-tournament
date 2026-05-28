import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createGroups, generateRoundRobinFixtures, generateGroupName } from '@/lib/tournament-logic'
import { Player } from '@/lib/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  const { data: tournament } = await supabase
    .from('tournaments').select('id').limit(1).single()
  if (!tournament) return NextResponse.json({ groups: [] })

  const { data: groups } = await supabase
    .from('groups')
    .select(`
      *,
      group_players (
        *,
        player:players (*)
      ),
      matches (
        id, match_number, round, status, score1, score2, winner_id,
        player1:players!matches_player1_id_fkey(id, name),
        player2:players!matches_player2_id_fkey(id, name)
      )
    `)
    .eq('tournament_id', tournament.id)
    .order('name', { ascending: true })

  return NextResponse.json({ groups: groups || [] })
}

export async function POST(request: NextRequest) {
  const { group_size } = await request.json()

  const { data: tournament } = await supabase
    .from('tournaments').select('*').limit(1).single()
  if (!tournament) return NextResponse.json({ error: 'Turnuva bulunamadı' }, { status: 404 })

  const { data: players } = await supabase
    .from('players')
    .select('*')
    .eq('tournament_id', tournament.id)
  if (!players || players.length < 2) {
    return NextResponse.json({ error: 'En az 2 oyuncu gerekli' }, { status: 400 })
  }

  // Delete existing groups and matches
  await supabase.from('groups').delete().eq('tournament_id', tournament.id)
  await supabase.from('matches').delete().eq('tournament_id', tournament.id).eq('stage', 'group')

  const size = group_size || tournament.group_size
  const playerGroups = createGroups(players as Player[], size)

  for (let i = 0; i < playerGroups.length; i++) {
    const groupName = generateGroupName(i)
    const { data: group } = await supabase
      .from('groups')
      .insert({ tournament_id: tournament.id, name: groupName })
      .select()
      .single()

    if (!group) continue

    // Insert group players
    await supabase.from('group_players').insert(
      playerGroups[i].map(p => ({ group_id: group.id, player_id: p.id }))
    )

    // Generate round-robin fixtures
    const fixtures = generateRoundRobinFixtures(playerGroups[i])
    await supabase.from('matches').insert(
      fixtures.map((f, idx) => ({
        tournament_id: tournament.id,
        group_id: group.id,
        round: `Grup ${groupName}`,
        match_number: idx + 1,
        player1_id: f[0].id,
        player2_id: f[1].id,
        stage: 'group',
        status: 'pending',
      }))
    )
  }

  // Update tournament group_size
  await supabase.from('tournaments').update({ group_size: size }).eq('id', tournament.id)

  return NextResponse.json({ ok: true })
}
