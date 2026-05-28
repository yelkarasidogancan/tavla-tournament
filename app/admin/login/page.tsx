'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    const data = await res.json()
    if (data.ok) {
      router.push('/admin')
    } else {
      setError(data.error || 'Hatalı şifre')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-board-pattern"
      style={{ background: '#0a0a0f' }}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm mx-4"
      >
        <div className="rounded-2xl overflow-hidden" style={{ background: '#13131a', border: '1px solid #2a2a3a' }}>
          <div className="px-8 py-8 text-center" style={{ borderBottom: '1px solid #2a2a3a' }}>
            <div className="text-5xl mb-4">🎲</div>
            <h1 className="font-display text-2xl font-bold" style={{ color: '#D4AF37' }}>Admin Paneli</h1>
            <p className="text-sm mt-1" style={{ color: '#6b6b8a' }}>Tavla Turnuvası Yönetimi</p>
          </div>
          <form onSubmit={handleLogin} className="px-8 py-8 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#6b6b8a' }}>Şifre</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl outline-none text-sm transition-colors"
                style={{ background: '#1a1a24', border: '1px solid #2a2a3a', color: '#f0e6d3' }}
                placeholder="••••••••"
                autoFocus
              />
            </div>
            {error && (
              <p className="text-sm text-center" style={{ color: '#E74C3C' }}>{error}</p>
            )}
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3 rounded-xl font-semibold transition-all disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #D4AF37, #A08020)', color: '#0a0a0f' }}
            >
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
