import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function getTournamentId(): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('tournaments')
      .select('id')
      .limit(1)
      .single()
    return data?.id || null
  } catch {
    return null
  }
}

export async function GET() {
  const tournamentId = await getTournamentId()
  if (!tournamentId) return NextResponse.json({ players: [] })

  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ players: data })
}

export async function POST(request: NextRequest) {
  const { name } = await request.json()
  if (!name?.trim()) return NextResponse.json({ error: 'İsim gerekli' }, { status: 400 })

  let tournamentId = await getTournamentId()
  if (!tournamentId) {
    const { data: t } = await supabase
      .from('tournaments')
      .insert({ name: 'Tavla Turnuvası', group_size: 4, advances_per_group: 2 })
      .select()
      .single()
    tournamentId = t?.id
  }

  const avatarSeed = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now()

  const { data, error } = await supabase
    .from('players')
    .insert({ tournament_id: tournamentId, name: name.trim(), avatar_seed: avatarSeed })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ player: data })
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json()
  const { error } = await supabase.from('players').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
