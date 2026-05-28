import Link from 'next/link'
import LogoutButton from './LogoutButton'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: '#0a0a0f' }}>
      <nav className="sticky top-0 z-50" style={{ background: '#13131a', borderBottom: '1px solid #2a2a3a' }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-display text-lg font-bold" style={{ color: '#D4AF37' }}>
              🎲 Admin
            </Link>
            <div className="hidden sm:flex items-center gap-4 text-sm">
              <NavLink href="/admin/players">Oyuncular</NavLink>
              <NavLink href="/admin/groups">Gruplar</NavLink>
              <NavLink href="/admin/matches">Maçlar</NavLink>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" target="_blank" className="text-xs px-3 py-1.5 rounded-lg"
              style={{ background: '#1a1a24', color: '#6b6b8a', border: '1px solid #2a2a3a' }}>
              Siteyi Gör
            </Link>
            <LogoutButton />
          </div>
        </div>
        <div className="flex sm:hidden border-t px-4 py-2 gap-4 text-sm" style={{ borderColor: '#2a2a3a' }}>
          <NavLink href="/admin/players">Oyuncular</NavLink>
          <NavLink href="/admin/groups">Gruplar</NavLink>
          <NavLink href="/admin/matches">Maçlar</NavLink>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-medium transition-colors hover:text-[#D4AF37]" style={{ color: '#a0a0b8' }}>
      {children}
    </Link>
  )
}
