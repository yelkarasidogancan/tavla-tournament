'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { GroupWithPlayers } from '@/lib/types'

export default function AdminGroups() {
  const [groups, setGroups] = useState<GroupWithPlayers[]>([])
  const [playerCount, setPlayerCount] = useState(0)
  const [groupSize, setGroupSize] = useState(4)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [gRes, pRes] = await Promise.all([fetch('/api/groups'), fetch('/api/players')])
    const [gData, pData] = await Promise.all([gRes.json(), pRes.json()])
    setGroups(gData.groups ?? [])
    setPlayerCount(pData.players?.length ?? 0)
    setFetching(false)
  }

  async function createGroups() {
    if (playerCount < groupSize) { alert(`En az ${groupSize} oyuncu gerekli`); return }
    if (!confirm('Mevcut gruplar ve maçlar silinecek. Devam etmek istiyor musunuz?')) return
    setLoading(true)
    const res = await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group_size: groupSize }),
    })
    if (res.ok) await loadData()
    setLoading(false)
  }

  const groupCount = playerCount > 0 ? Math.ceil(playerCount / groupSize) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold" style={{ color: '#D4AF37' }}>Gruplar</h1>
        <p className="mt-1" style={{ color: '#6b6b8a' }}>{playerCount} oyuncu — {groups.length} grup</p>
      </div>

      {/* Config */}
      <div className="rounded-2xl p-6 space-y-4" style={{ background: '#13131a', border: '1px solid #2a2a3a' }}>
        <h2 className="font-semibold" style={{ color: '#f0e6d3' }}>Grup Ayarları</h2>
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <label className="block text-xs mb-1" style={{ color: '#6b6b8a' }}>Grup Boyutu</label>
            <select
              value={groupSize}
              onChange={e => setGroupSize(Number(e.target.value))}
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: '#1a1a24', border: '1px solid #2a2a3a', color: '#f0e6d3' }}
            >
              {[3, 4, 5, 6, 8].map(n => (
                <option key={n} value={n}>{n} kişilik</option>
              ))}
            </select>
          </div>
          <div className="text-sm pt-5" style={{ color: '#6b6b8a' }}>
            → {playerCount} oyuncu ÷ {groupSize} = <strong style={{ color: '#f0e6d3' }}>{groupCount} grup</strong>
          </div>
          <div className="pt-5">
            <button
              onClick={createGroups}
              disabled={loading || playerCount < groupSize}
              className="px-5 py-2 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #D4AF37, #A08020)', color: '#0a0a0f' }}
            >
              {loading ? 'Oluşturuluyor...' : groups.length > 0 ? '🔄 Yeniden Oluştur' : '✨ Grupları Oluştur'}
            </button>
          </div>
        </div>
      </div>

      {/* Groups display */}
      {fetching ? (
        <div className="text-center py-10" style={{ color: '#6b6b8a' }}>Yükleniyor...</div>
      ) : groups.length === 0 ? (
        <div className="text-center py-10" style={{ color: '#6b6b8a' }}>
          <div className="text-4xl mb-3">🏆</div>
          <p>Henüz grup oluşturulmadı</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group, idx) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="rounded-xl overflow-hidden"
              style={{ background: '#13131a', border: '1px solid #2a2a3a' }}
            >
              <div className="px-4 py-3 font-display font-bold text-lg"
                style={{ background: '#1a1a24', color: '#D4AF37', borderBottom: '1px solid #2a2a3a' }}>
                Grup {group.name}
              </div>
              <div className="divide-y" style={{ borderColor: '#1f1f2e' }}>
                {group.group_players.map(gp => (
                  <div key={gp.player_id} className="px-4 py-2.5 flex items-center gap-2">
                    <span style={{ color: '#6b6b8a' }}>·</span>
                    <span className="text-sm" style={{ color: '#f0e6d3' }}>{gp.player?.name}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
