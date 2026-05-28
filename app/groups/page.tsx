'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { motion } from 'framer-motion'
import GroupTable from '@/components/public/GroupTable'
import LiveBadge from '@/components/public/LiveBadge'
import { GroupWithPlayers, Tournament } from '@/lib/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function GroupsPage() {
  const [groups, setGroups] = useState<GroupWithPlayers[]>([])
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()

    const channel = supabase
      .channel('groups-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_players' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, loadData)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function loadData() {
    const [tRes, gRes] = await Promise.all([
      fetch('/api/tournament'),
      fetch('/api/groups'),
    ])
    const [tData, gData] = await Promise.all([tRes.json(), gRes.json()])
    setTournament(tData.tournament)
    setGroups(gData.groups ?? [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
        <div className="text-center" style={{ color: '#6b6b8a' }}>
          <div className="text-4xl mb-3 animate-spin">🎲</div>
          <p>Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-board-pattern" style={{ background: '#0a0a0f' }}>
      {/* Header */}
      <header className="sticky top-0 z-50" style={{ background: 'rgba(10,10,15,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #2a2a3a' }}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-display text-lg font-bold" style={{ color: '#D4AF37' }}>
              ← {tournament?.name ?? 'Turnuva'}
            </Link>
            {tournament?.status === 'published' && <LiveBadge />}
          </div>
          <Link href="/bracket"
            className="text-sm px-4 py-2 rounded-lg transition-all hover:scale-105"
            style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)' }}>
            Bracket →
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-4xl font-bold" style={{ color: '#f0e6d3' }}>
            Grup <span className="gold-shimmer">Sıralamaları</span>
          </h1>
          <p className="mt-2" style={{ color: '#6b6b8a' }}>
            Her gruptan ilk {tournament?.advances_per_group ?? 2} oyuncu eleme turuna geçiyor
          </p>
        </motion.div>

        {groups.length === 0 ? (
          <div className="text-center py-20" style={{ color: '#6b6b8a' }}>
            <div className="text-6xl mb-4">🏆</div>
            <p className="text-lg">Gruplar henüz oluşturulmadı</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {groups.map((group, idx) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
              >
                <GroupTable group={group} advancesPerGroup={tournament?.advances_per_group ?? 2} />
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
