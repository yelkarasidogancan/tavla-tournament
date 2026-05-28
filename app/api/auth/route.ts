import { NextRequest, NextResponse } from 'next/server'
import { checkAdminPassword, setAdminSession, clearAdminSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const { password, action } = await request.json()

  if (action === 'logout') {
    await clearAdminSession()
    return NextResponse.json({ ok: true })
  }

  if (!checkAdminPassword(password)) {
    return NextResponse.json({ error: 'Hatalı şifre' }, { status: 401 })
  }

  await setAdminSession()
  return NextResponse.json({ ok: true })
}
