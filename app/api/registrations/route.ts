import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyAdminSession } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function getTournamentId(): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('tournaments').select('id').limit(1).single()
    return data?.id ?? null
  } catch { return null }
}

// GET — admin için tüm başvuruları getir
export async function GET() {
  const tournamentId = await getTournamentId()
  if (!tournamentId) return NextResponse.json({ registrations: [] })

  const { data, error } = await supabase
    .from('registrations')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ registrations: data ?? [] })
}

// POST — kullanıcı form gönderiyor
export async function POST(request: NextRequest) {
  const { name, apartment } = await request.json()

  if (!name?.trim()) return NextResponse.json({ error: 'İsim gerekli' }, { status: 400 })
  if (!apartment?.trim()) return NextResponse.json({ error: 'Daire numarası gerekli' }, { status: 400 })

  const tournamentId = await getTournamentId()
  if (!tournamentId) return NextResponse.json({ error: 'Aktif turnuva bulunamadı' }, { status: 404 })

  // Aynı daireden tekrar kayıt engelle
  const { data: existing } = await supabase
    .from('registrations')
    .select('id')
    .eq('tournament_id', tournamentId)
    .eq('apartment', apartment.trim())
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Bu daire numarasıyla zaten kayıt yapılmış' }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('registrations')
    .insert({ tournament_id: tournamentId, name: name.trim(), apartment: apartment.trim() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ registration: data })
}

// PATCH — admin "turnuvaya ekle" işareti (added_to_tournament = true)
export async function PATCH(request: NextRequest) {
  const isAdmin = await verifyAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { id, added_to_tournament } = await request.json()

  const { data, error } = await supabase
    .from('registrations')
    .update({ added_to_tournament })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ registration: data })
}

// DELETE — admin başvuruyu siler
export async function DELETE(request: NextRequest) {
  const isAdmin = await verifyAdminSession()
  if (!isAdmin) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { id } = await request.json()
  const { error } = await supabase.from('registrations').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
