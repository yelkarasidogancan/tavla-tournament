'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Player, Registration } from '@/lib/types'
import * as XLSX from 'xlsx'

export default function AdminPlayers() {
  const [players, setPlayers] = useState<Player[]>([])
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const [pRes, rRes] = await Promise.all([
      fetch('/api/players'),
      fetch('/api/registrations'),
    ])
    const [pData, rData] = await Promise.all([pRes.json(), rRes.json()])
    setPlayers(pData.players ?? [])
    setRegistrations(rData.registrations ?? [])
    setFetching(false)
  }

  async function addPlayer(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    const res = await fetch('/api/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    const data = await res.json()
    if (data.player) {
      setPlayers(prev => [...prev, data.player])
      setName('')
    }
    setLoading(false)
  }

  async function removePlayer(id: string) {
    await fetch('/api/players', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setPlayers(prev => prev.filter(p => p.id !== id))
  }

  // Başvuruyu turnuvaya ekle
  async function addFromRegistration(reg: Registration) {
    const res = await fetch('/api/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: reg.name }),
    })
    const data = await res.json()
    if (data.player) {
      setPlayers(prev => [...prev, data.player])
      // Başvuruyu "eklendi" olarak işaretle
      await fetch('/api/registrations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reg.id, added_to_tournament: true }),
      })
      setRegistrations(prev =>
        prev.map(r => r.id === reg.id ? { ...r, added_to_tournament: true } : r)
      )
    }
  }

  // Başvuruyu sil
  async function deleteRegistration(id: string) {
    await fetch('/api/registrations', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setRegistrations(prev => prev.filter(r => r.id !== id))
  }

  const pendingRegistrations = registrations.filter(r => !r.added_to_tournament)
  const addedRegistrations = registrations.filter(r => r.added_to_tournament)

  function exportToExcel() {
    const wb = XLSX.utils.book_new()

    // İsimden daire numarasını bul (başvuru kaydından)
    const apartmentByName = new Map(registrations.map(r => [r.name.trim().toLowerCase(), r.apartment]))

    // Oyuncular sayfası (daire dahil)
    const playerData = players.map((p, i) => ({
      'Sıra': i + 1,
      'Ad Soyad': p.name,
      'Daire': apartmentByName.get(p.name.trim().toLowerCase()) ?? '—',
    }))
    const ws = XLSX.utils.json_to_sheet(playerData)
    ws['!cols'] = [{ wch: 6 }, { wch: 30 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(wb, ws, 'Oyuncular')

    // Başvurular sayfası (varsa)
    if (registrations.length > 0) {
      const regData = registrations.map((r, i) => ({
        'Sıra': i + 1,
        'Ad Soyad': r.name,
        'Daire': r.apartment,
        'Başvuru Tarihi': new Date(r.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        'Durum': r.added_to_tournament ? 'Eklendi' : 'Bekliyor',
      }))
      const ws2 = XLSX.utils.json_to_sheet(regData)
      ws2['!cols'] = [{ wch: 6 }, { wch: 30 }, { wch: 10 }, { wch: 22 }, { wch: 12 }]
      XLSX.utils.book_append_sheet(wb, ws2, 'Başvurular')
    }

    XLSX.writeFile(wb, `tavla-turnuvasi-oyuncular-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold" style={{ color: '#D4AF37' }}>Oyuncular</h1>
        <p className="mt-1" style={{ color: '#6b6b8a' }}>{players.length} oyuncu kayıtlı</p>
      </div>

      {/* Katılım Başvuruları */}
      {!fetching && registrations.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.3)' }}>
          <div className="px-5 py-4 flex items-center justify-between"
            style={{ background: 'rgba(212,175,55,0.08)', borderBottom: '1px solid rgba(212,175,55,0.2)' }}>
            <div>
              <h2 className="font-semibold" style={{ color: '#D4AF37' }}>
                🎯 Katılım Başvuruları
              </h2>
              <p className="text-xs mt-0.5" style={{ color: '#6b6b8a' }}>
                {pendingRegistrations.length} bekliyor · {addedRegistrations.length} eklendi
              </p>
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            {registrations.map((reg, idx) => (
              <motion.div
                key={reg.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                transition={{ delay: idx * 0.03 }}
                className="flex items-center justify-between px-5 py-3 gap-3"
                style={{
                  background: reg.added_to_tournament
                    ? 'rgba(34,197,94,0.04)'
                    : idx % 2 === 0 ? '#13131a' : '#111118',
                  borderBottom: '1px solid #1f1f2e',
                  opacity: reg.added_to_tournament ? 0.6 : 1,
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex-shrink-0">
                    <AvatarDot name={reg.name} size={36} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate" style={{ color: '#f0e6d3' }}>
                      {reg.name}
                    </p>
                    <p className="text-xs" style={{ color: '#6b6b8a' }}>
                      Daire {reg.apartment} · {new Date(reg.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {reg.added_to_tournament ? (
                    <span className="text-xs px-2 py-1 rounded-lg font-medium"
                      style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>
                      ✓ Eklendi
                    </span>
                  ) : (
                    <button
                      onClick={() => addFromRegistration(reg)}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all hover:scale-105"
                      style={{ background: 'rgba(212,175,55,0.15)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)' }}
                    >
                      + Ekle
                    </button>
                  )}
                  <button
                    onClick={() => deleteRegistration(reg.id)}
                    className="text-xs px-2 py-1.5 rounded-lg transition-colors hover:bg-red-900/30"
                    style={{ color: '#6b6b8a' }}
                  >
                    ✕
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Manuel oyuncu ekleme */}
      <div>
        <h2 className="font-semibold mb-3" style={{ color: '#f0e6d3' }}>Manuel Ekle</h2>
        <form onSubmit={addPlayer} className="flex gap-3">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Oyuncu adı..."
            className="flex-1 px-4 py-3 rounded-xl outline-none text-sm"
            style={{ background: '#13131a', border: '1px solid #2a2a3a', color: '#f0e6d3' }}
          />
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="px-5 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #D4AF37, #A08020)', color: '#0a0a0f' }}
          >
            {loading ? '...' : '+ Ekle'}
          </button>
        </form>
      </div>

      {/* Oyuncu listesi */}
      {fetching ? (
        <div className="text-center py-10" style={{ color: '#6b6b8a' }}>Yükleniyor...</div>
      ) : players.length === 0 ? (
        <div className="text-center py-10" style={{ color: '#6b6b8a' }}>
          <div className="text-4xl mb-3">👤</div>
          <p>Henüz oyuncu eklenmedi</p>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold" style={{ color: '#f0e6d3' }}>
              Turnuva Oyuncuları
              <span className="ml-2 text-sm font-normal" style={{ color: '#6b6b8a' }}>{players.length} kişi</span>
            </h2>
            <button
              onClick={exportToExcel}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all hover:scale-105"
              style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}
            >
              📥 Excel
            </button>
          </div>
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #2a2a3a' }}>
            <AnimatePresence mode="popLayout">
              {players.map((player, idx) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="flex items-center justify-between px-5 py-3 hover:bg-[#1a1a24] transition-colors"
                  style={{ background: idx % 2 === 0 ? '#13131a' : '#111118', borderBottom: '1px solid #1f1f2e' }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium w-6 text-right" style={{ color: '#6b6b8a' }}>{idx + 1}</span>
                    <AvatarDot name={player.name} size={36} />
                    <span className="font-medium" style={{ color: '#f0e6d3' }}>{player.name}</span>
                  </div>
                  <button
                    onClick={() => removePlayer(player.id)}
                    className="text-xs px-3 py-1.5 rounded-lg transition-colors hover:bg-red-900/30"
                    style={{ color: '#6b6b8a' }}
                  >
                    ✕
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  )
}

function AvatarDot({ name, size }: { name: string; size: number }) {
  const hue = name.charCodeAt(0) * 17 % 360
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold flex-shrink-0"
      style={{
        width: size, height: size,
        fontSize: size * 0.35,
        background: `hsl(${hue},50%,22%)`,
        border: `1px solid hsl(${hue},50%,38%)`,
        color: `hsl(${hue},80%,72%)`,
      }}
    >
      {initials}
    </div>
  )
}
