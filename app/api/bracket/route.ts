import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateKnockoutBracket, getKnockoutRoundName } from '@/lib/tournament-logic'
import { Player } from '@/lib/types'
import { verifyAdminSession } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  const { data: tournament } = await supabase
    .from('tournaments').select('id').limit(1).single()
  if (!tournament) return NextResponse.json({ matches: [] })

  const { data: matches } = await supabase
    .from('matches')
    .select(`
      *,
      player1:players!matches_player1_id_fkey(*),
      player2:players!matches_player2_id_fkey(*),
      winner:players!matches_winner_id_fkey(*)
    `)
    .eq('tournament_id', tournament.id)
    .eq('stage', 'knockout')
    .order('match_number', { ascending: true })

  return NextResponse.json({ matches: matches || [] })
}

export async function POST() {
  const isAdmin = await verifyAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { data: tournament } = await supabase
    .from('tournaments').select('*').limit(1).single()
  if (!tournament) return NextResponse.json({ error: 'Turnuva bulunamadı' }, { status: 404 })

  const { data: groups } = await supabase
    .from('groups')
    .select(`*, group_players(player_id, position, player:players(*))`)
    .eq('tournament_id', tournament.id)

  if (!groups || groups.length === 0) {
    return NextResponse.json({ error: 'Henüz grup oluşturulmadı' }, { status: 400 })
  }

  const advancingPlayers: { player: Player; groupName: string; position: number }[] = []
  for (const group of groups) {
    for (const gp of group.group_players) {
      if (gp.position !== null && gp.position <= tournament.advances_per_group) {
        advancingPlayers.push({ player: gp.player as Player, groupName: group.name, position: gp.position })
      }
    }
  }

  if (advancingPlayers.length < 2) {
    return NextResponse.json({ error: 'Yeterli oyuncu ilerlemedi' }, { status: 400 })
  }

  // Mevcut eleme maçlarını temizle
  await supabase.from('matches').delete()
    .eq('tournament_id', tournament.id).eq('stage', 'knockout')

  const initialMatches = generateKnockoutBracket(advancingPlayers)
  // generateKnockoutBracket'ın gerçekte eşleştirdiği oyuncu sayısını kullan
  const totalPlayers = initialMatches.length * 2

  // Tur adlarını hesapla: en küçükten en büyüğe (Final en sonda)
  const rounds: string[] = []
  let count = totalPlayers
  while (count >= 2) {
    rounds.push(getKnockoutRoundName(count))
    count = Math.floor(count / 2)
  }

  // İlk tur maçlarını ekle
  const insertedFirstRound: { id: string; match_number: number }[] = []
  for (const m of initialMatches) {
    const { data } = await supabase.from('matches').insert({
      tournament_id: tournament.id,
      round: m.round,
      match_number: m.matchNumber,
      player1_id: m.player1Id,
      player2_id: m.player2Id,
      stage: 'knockout',
      status: 'pending',
    }).select('id, match_number').single()
    if (data) insertedFirstRound.push(data)
  }

  // 4 oyunculu bracket'ta ilk tur zaten Yarı Final; döngü öncesi yakala
  let semiFinalMatches: { id: string; match_number: number }[] =
    rounds[0] === 'Yarı Final' ? [...insertedFirstRound] : []

  // Sonraki turların placeholder maçlarını oluştur ve bağla
  let prevRoundMatches = insertedFirstRound

  for (let r = 1; r < rounds.length; r++) {
    const roundName = rounds[r]
    const matchCount = Math.floor(prevRoundMatches.length / 2)
    const currentRoundMatches: { id: string; match_number: number }[] = []

    for (let i = 0; i < matchCount; i++) {
      const { data } = await supabase.from('matches').insert({
        tournament_id: tournament.id,
        round: roundName,
        match_number: i + 1,
        stage: 'knockout',
        status: 'pending',
      }).select('id, match_number').single()
      if (data) currentRoundMatches.push(data)
    }

    // Önceki turdaki kazananları bu tura bağla
    for (let i = 0; i < prevRoundMatches.length; i++) {
      const nextMatchIdx = Math.floor(i / 2)
      const slot = (i % 2) + 1
      await supabase.from('matches').update({
        next_match_id: currentRoundMatches[nextMatchIdx]?.id,
        next_match_slot: slot,
      }).eq('id', prevRoundMatches[i].id)
    }

    // Yarı Final turunu kaydet — kaybedenleri 3. lük maçına göndermek için
    // currentRoundMatches = yeni oluşturulan Yarı Final maçları; prevRoundMatches değil!
    if (roundName === 'Yarı Final') {
      semiFinalMatches = [...currentRoundMatches]
    }

    prevRoundMatches = currentRoundMatches
  }

  // 3. lük maçını oluştur — sadece Yarı Final varsa (en az 4 oyuncu)
  if (semiFinalMatches.length === 2) {
    const { data: thirdPlace } = await supabase.from('matches').insert({
      tournament_id: tournament.id,
      round: '3. lük Maçı',
      match_number: 1,
      stage: 'knockout',
      status: 'pending',
    }).select('id').single()

    if (thirdPlace) {
      // Her yarı final maçının kaybedeni 3. lük maçına gitsin
      await supabase.from('matches').update({
        loser_next_match_id: thirdPlace.id,
        loser_next_match_slot: 1,
      }).eq('id', semiFinalMatches[0].id)

      await supabase.from('matches').update({
        loser_next_match_id: thirdPlace.id,
        loser_next_match_slot: 2,
      }).eq('id', semiFinalMatches[1].id)
    }
  }

  return NextResponse.json({ ok: true })
}
