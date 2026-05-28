import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyAdminSession } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ tournament: null })
    }

    return NextResponse.json({ tournament: data || null })
  } catch {
    return NextResponse.json({ tournament: null })
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, group_size, advances_per_group, tournament_date, location } = body

  const { data: existing } = await supabase
    .from('tournaments')
    .select('id')
    .limit(1)
    .single()

  if (existing) {
    const { data, error } = await supabase
      .from('tournaments')
      .update({ name, group_size, advances_per_group, tournament_date: tournament_date || null, location: location || null })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ tournament: data })
  }

  const { data, error } = await supabase
    .from('tournaments')
    .insert({
      name,
      group_size: group_size || 4,
      advances_per_group: advances_per_group || 2,
      tournament_date: tournament_date || null,
      location: location || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tournament: data })
}

export async function DELETE() {
  try {
    const { data: tournament } = await supabase
      .from('tournaments')
      .select('id')
      .limit(1)
      .single()

    if (!tournament) return NextResponse.json({ ok: true })

    const { error } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', tournament.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Silme başarısız' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const isAdmin = await verifyAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const body = await request.json()

  // Yalnızca izin verilen alanları güncelle — mass assignment engeli
  const ALLOWED_FIELDS = ['status', 'name', 'group_size', 'advances_per_group', 'tournament_date', 'location'] as const
  const safeBody = Object.fromEntries(
    Object.entries(body).filter(([k]) => (ALLOWED_FIELDS as readonly string[]).includes(k))
  )

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id')
    .limit(1)
    .single()

  if (!tournament) return NextResponse.json({ error: 'Turnuva bulunamadı' }, { status: 404 })

  const { data, error } = await supabase
    .from('tournaments')
    .update(safeBody)
    .eq('id', tournament.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tournament: data })
}
