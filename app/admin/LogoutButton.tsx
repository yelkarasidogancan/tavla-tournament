'use client'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  async function logout() {
    await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
    })
    router.push('/admin/login')
  }

  return (
    <button onClick={logout} className="text-xs px-3 py-1.5 rounded-lg transition-colors"
      style={{ background: 'rgba(192,57,43,0.15)', color: '#E74C3C', border: '1px solid rgba(192,57,43,0.3)' }}>
      Çıkış
    </button>
  )
}
