'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { motion } from 'framer-motion'
import TournamentBracket from '@/components/public/TournamentBracket'
import LiveBadge from '@/components/public/LiveBadge'
import { Match, Tournament } from '@/lib/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function BracketPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()

    const channel = supabase
      .channel('bracket-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, loadData)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function loadData() {
    const [tRes, bRes] = await Promise.all([
      fetch('/api/tournament'),
      fetch('/api/bracket'),
    ])
    const [tData, bData] = await Promise.all([tRes.json(), bRes.json()])
    setTournament(tData.tournament)
    setMatches(bData.matches ?? [])
    setLoading(false)
  }

  const champion = matches.find(m => m.round === 'Final' && m.status === 'completed')?.winner

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
      <header className="sticky top-0 z-50" style={{ background: 'rgba(10,10,15,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #2a2a3a' }}>
        <div className="max-w-full px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-display text-lg font-bold" style={{ color: '#D4AF37' }}>
              ← {tournament?.name ?? 'Turnuva'}
            </Link>
            {tournament?.status === 'published' && <LiveBadge />}
          </div>
          <Link href="/groups"
            className="text-sm px-4 py-2 rounded-lg transition-all hover:scale-105"
            style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)' }}>
            Gruplar
          </Link>
        </div>
      </header>

      <main className="px-4 py-8">
        {champion && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto mb-10 text-center rounded-2xl py-8 px-6"
            style={{
              background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(160,128,32,0.08))',
              border: '2px solid #D4AF37',
            }}
          >
            <div className="text-6xl mb-3">🏆</div>
            <p className="text-sm font-medium tracking-widest uppercase mb-2" style={{ color: '#A08020' }}>Şampiyon</p>
            <h2 className="font-display text-4xl font-bold gold-shimmer">{champion.name}</h2>
          </motion.div>
        )}

        <div className="max-w-full overflow-x-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <h1 className="font-display text-4xl font-bold px-4" style={{ color: '#f0e6d3' }}>
              Eleme <span className="gold-shimmer">Bracket</span>
            </h1>
          </motion.div>
          <TournamentBracket matches={matches} />
        </div>
      </main>
    </div>
  )
}
