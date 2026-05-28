import { NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE = 'tavla_admin_session'
const SESSION_VALUE = 'authenticated'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const session = request.cookies.get(SESSION_COOKIE)
    if (session?.value !== SESSION_VALUE) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
