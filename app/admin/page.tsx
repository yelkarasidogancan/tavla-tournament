'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Tournament } from '@/lib/types'

export default function AdminDashboard() {
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [playerCount, setPlayerCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [resetting, setResetting] = useState(false)

  // Settings form state
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [dateInput, setDateInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [tRes, pRes] = await Promise.all([
      fetch('/api/tournament'),
      fetch('/api/players'),
    ])
    const [tData, pData] = await Promise.all([tRes.json(), pRes.json()])
    const t: Tournament | null = tData.tournament
    setTournament(t)
    setPlayerCount(pData.players?.length ?? 0)
    if (t) {
      setName(t.name)
      setLocation(t.location ?? '')
      // Convert ISO date to datetime-local input format (YYYY-MM-DDTHH:mm)
      setDateInput(t.tournament_date ? t.tournament_date.slice(0, 16) : '')
    }
    setLoading(false)
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/tournament', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name || 'Tavla Turnuvası',
        group_size: tournament?.group_size ?? 4,
        advances_per_group: tournament?.advances_per_group ?? 2,
        tournament_date: dateInput ? new Date(dateInput).toISOString() : null,
        location: location || null,
      }),
    })
    const data = await res.json()
    setTournament(data.tournament)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handlePublish() {
    setPublishing(true)
    const res = await fetch('/api/tournament', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'published' }),
    })
    const data = await res.json()
    setTournament(data.tournament)
    setPublishing(false)
  }

  async function handleReset() {
    if (!confirm('Mevcut turnuva, tüm oyuncular ve maçlarla birlikte kalıcı olarak silinecek. Emin misiniz?')) return
    setResetting(true)
    await fetch('/api/tournament', { method: 'DELETE' })
    setTournament(null)
    setPlayerCount(0)
    setName('')
    setLocation('')
    setDateInput('')
    setResetting(false)
  }

  const statusLabel = { draft: 'Taslak', published: 'Yayında', completed: 'Tamamlandı' }
  const statusColor = { draft: '#6b6b8a', published: '#22c55e', completed: '#D4AF37' }

  if (loading) {
    return <div className="text-center py-20" style={{ color: '#6b6b8a' }}>Yükleniyor...</div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold" style={{ color: '#D4AF37' }}>Dashboard</h1>
        <p className="mt-1" style={{ color: '#6b6b8a' }}>Turnuva yönetim paneli</p>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Oyuncular" value={playerCount} icon="👥" />
        <StatCard label="Durum" value={tournament ? statusLabel[tournament.status] : '—'} icon="📊"
          valueColor={tournament ? statusColor[tournament.status] : '#6b6b8a'} />
        <StatCard label="Grup Boyutu" value={tournament?.group_size ?? '—'} icon="🏷️" />
      </div>

      {/* Tournament settings */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6"
        style={{ background: '#13131a', border: '1px solid #2a2a3a' }}
      >
        <h2 className="font-semibold text-lg mb-5 flex items-center gap-2" style={{ color: '#f0e6d3' }}>
          ⚙️ Turnuva Ayarları
        </h2>
        <form onSubmit={handleSaveSettings} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#6b6b8a' }}>Turnuva Adı</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Tavla Turnuvası"
              className="w-full px-4 py-2.5 rounded-xl outline-none text-sm"
              style={{ background: '#1a1a24', border: '1px solid #2a2a3a', color: '#f0e6d3' }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#6b6b8a' }}>
              📅 Turnuva Tarihi ve Saati
            </label>
            <input
              type="datetime-local"
              value={dateInput}
              onChange={e => setDateInput(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl outline-none text-sm"
              style={{ background: '#1a1a24', border: '1px solid #2a2a3a', color: '#f0e6d3', colorScheme: 'dark' }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#6b6b8a' }}>
              📍 Lokasyon
            </label>
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="örn. İstanbul, Kapalıçarşı Kıraathanesi"
              className="w-full px-4 py-2.5 rounded-xl outline-none text-sm"
              style={{ background: '#1a1a24', border: '1px solid #2a2a3a', color: '#f0e6d3' }}
            />
          </div>
          <div className="sm:col-span-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #D4AF37, #A08020)', color: '#0a0a0f' }}
            >
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            {saved && (
              <motion.span
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="text-sm"
                style={{ color: '#22c55e' }}
              >
                ✓ Kaydedildi
              </motion.span>
            )}
          </div>
        </form>
      </motion.div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ActionCard href="/admin/players" title="Oyuncu Ekle" desc="Turnuvaya katılımcı ekle veya çıkar" icon="👤" />
        <ActionCard href="/admin/groups" title="Grupları Oluştur" desc="Oyuncuları gruplara dağıt ve fikstür oluştur" icon="🏆" />
        <ActionCard href="/admin/matches" title="Skor Gir" desc="Oynanan maçların sonuçlarını kaydet" icon="📝" />
        <ActionCard href="/" title="Turnuvayı Görüntüle" desc="Kullanıcıların gördüğü sayfayı aç" icon="👁️" external />
      </div>

      {/* Publish */}
      {tournament?.status === 'draft' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-8 text-center"
          style={{ background: '#13131a', border: '2px solid #D4AF37' }}
        >
          <div className="text-4xl mb-3">🚀</div>
          <h2 className="font-display text-2xl font-bold mb-2" style={{ color: '#D4AF37' }}>
            Turnuvayı Yayınla
          </h2>
          <p className="text-sm mb-6" style={{ color: '#6b6b8a' }}>
            Yayınladıktan sonra herkes geri sayımı ve turnuvayı takip edebilir
          </p>
          <button
            onClick={handlePublish}
            disabled={publishing || playerCount === 0}
            className="px-8 py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-40 hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #D4AF37, #A08020)',
              color: '#0a0a0f',
              boxShadow: '0 0 30px rgba(212,175,55,0.3)',
            }}
          >
            {publishing ? 'Yayınlanıyor...' : '🎯 GO LIVE'}
          </button>
        </motion.div>
      )}

      {tournament?.status === 'published' && (
        <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
          <p className="font-semibold" style={{ color: '#22c55e' }}>✓ Turnuva yayında — herkes takip edebilir</p>
        </div>
      )}

      {/* Danger zone */}
      <div className="rounded-2xl p-6" style={{ background: '#13131a', border: '1px solid rgba(192,57,43,0.3)' }}>
        <h3 className="font-semibold mb-1" style={{ color: '#E74C3C' }}>⚠️ Tehlikeli Alan</h3>
        <p className="text-sm mb-4" style={{ color: '#6b6b8a' }}>
          Tüm turnuva verisini (oyuncular, gruplar, maçlar) kalıcı olarak siler.
          Yeni bir turnuva başlatmak için kullanın.
        </p>
        <button
          onClick={handleReset}
          disabled={resetting || !tournament}
          className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-40"
          style={{ background: 'rgba(192,57,43,0.15)', color: '#E74C3C', border: '1px solid rgba(192,57,43,0.4)' }}
        >
          {resetting ? 'Siliniyor...' : '🗑️ Turnuvayı Sil ve Sıfırla'}
        </button>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, valueColor }: { label: string; value: string | number; icon: string; valueColor?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-5"
      style={{ background: '#13131a', border: '1px solid #2a2a3a' }}
    >
      <div className="text-2xl mb-3">{icon}</div>
      <div className="text-2xl font-bold mb-1" style={{ color: valueColor ?? '#f0e6d3' }}>{value}</div>
      <div className="text-sm" style={{ color: '#6b6b8a' }}>{label}</div>
    </motion.div>
  )
}

function ActionCard({ href, title, desc, icon, external }: { href: string; title: string; desc: string; icon: string; external?: boolean }) {
  return (
    <Link href={href} target={external ? '_blank' : undefined}
      className="block rounded-xl p-5 transition-all hover:border-[#D4AF37] hover:scale-[1.02]"
      style={{ background: '#13131a', border: '1px solid #2a2a3a' }}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <div className="font-semibold mb-1" style={{ color: '#f0e6d3' }}>{title}</div>
          <div className="text-sm" style={{ color: '#6b6b8a' }}>{desc}</div>
        </div>
      </div>
    </Link>
  )
}
