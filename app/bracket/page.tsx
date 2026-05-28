'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import TournamentBracket from '@/components/public/TournamentBracket'
import LiveBadge from '@/components/public/LiveBadge'
import { Match, Tournament, Player } from '@/lib/types'

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
    try {
      const [tRes, bRes] = await Promise.all([fetch('/api/tournament'), fetch('/api/bracket')])
      const [tData, bData] = await Promise.all([tRes.json(), bRes.json()])
      setTournament(tData.tournament)
      setMatches(bData.matches ?? [])
    } finally {
      setLoading(false)
    }
  }

  // Sonuçları hesapla
  const finalMatch = matches.find(m => m.round === 'Final' && m.status === 'completed')
  const champion: Player | null = finalMatch?.winner ?? null
  const runnerUp: Player | null = finalMatch
    ? (finalMatch.winner_id === finalMatch.player1_id ? (finalMatch.player2 ?? null) : (finalMatch.player1 ?? null))
    : null
  const thirdPlaceMatch = matches.find(m => m.round === '3. lük Maçı' && m.status === 'completed')
  const thirdPlace: Player | null = thirdPlaceMatch?.winner ?? null

  const showPodium = champion && runnerUp

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          className="text-5xl">🎲</motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-board-pattern" style={{ background: '#0a0a0f' }}>
      {/* Header */}
      <header className="sticky top-0 z-50" style={{ background: 'rgba(10,10,15,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #2a2a3a' }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Link href="/" className="font-display text-base sm:text-lg font-bold truncate" style={{ color: '#D4AF37' }}>
              ← <span className="hidden xs:inline">{tournament?.name ?? 'Turnuva'}</span>
              <span className="xs:hidden">Geri</span>
            </Link>
            {tournament?.status === 'published' && <LiveBadge />}
          </div>
          <Link href="/groups"
            className="flex-shrink-0 text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-lg transition-all"
            style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)' }}>
            Gruplar
          </Link>
        </div>
      </header>

      <main className="px-3 sm:px-4 py-6 sm:py-8 max-w-6xl mx-auto space-y-8">
        {/* Başlık */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl sm:text-4xl font-bold px-1" style={{ color: '#f0e6d3' }}>
            Eleme <span className="gold-shimmer">Bracket</span>
          </h1>
        </motion.div>

        {/* Podyum — turnuva bittikten sonra */}
        <AnimatePresence>
          {showPodium && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="rounded-3xl overflow-hidden"
              style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.08), rgba(10,10,15,0))', border: '2px solid #D4AF37' }}
            >
              {/* Başlık */}
              <div className="text-center pt-8 pb-4 px-4">
                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ repeat: Infinity, duration: 2.5 }}
                  className="text-6xl sm:text-7xl mb-3"
                >🏆</motion.div>
                <p className="text-xs sm:text-sm font-bold tracking-widest uppercase" style={{ color: '#A08020' }}>
                  Turnuva Sona Erdi
                </p>
              </div>

              {/* Podyum */}
              <div className="flex items-end justify-center gap-3 sm:gap-6 px-4 pb-8">

                {/* 2. sıra */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-col items-center"
                >
                  <span className="text-3xl sm:text-4xl mb-2">🥈</span>
                  <div className="rounded-2xl px-4 sm:px-6 py-4 text-center"
                    style={{ background: 'rgba(180,180,200,0.08)', border: '1px solid rgba(180,180,200,0.2)', minWidth: '90px' }}>
                    <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: '#a0a0b8' }}>2.</p>
                    <p className="font-display text-sm sm:text-base font-bold" style={{ color: '#c0c0d8' }}>
                      {runnerUp.name}
                    </p>
                  </div>
                  <div className="h-12 sm:h-16 w-full mt-2 rounded-t-lg" style={{ background: 'rgba(180,180,200,0.08)' }} />
                </motion.div>

                {/* 1. sıra — ortada ve yüksekte */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0 }}
                  className="flex flex-col items-center"
                >
                  <span className="text-4xl sm:text-5xl mb-2">🥇</span>
                  <div className="rounded-2xl px-4 sm:px-8 py-4 text-center"
                    style={{ background: 'rgba(212,175,55,0.12)', border: '2px solid #D4AF37', minWidth: '110px' }}>
                    <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: '#A08020' }}>Şampiyon</p>
                    <p className="font-display text-base sm:text-xl font-black gold-shimmer">
                      {champion.name}
                    </p>
                  </div>
                  <div className="h-20 sm:h-24 w-full mt-2 rounded-t-lg" style={{ background: 'rgba(212,175,55,0.08)' }} />
                </motion.div>

                {/* 3. sıra */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="flex flex-col items-center"
                >
                  <span className="text-3xl sm:text-4xl mb-2">🥉</span>
                  <div className="rounded-2xl px-4 sm:px-6 py-4 text-center"
                    style={{ background: 'rgba(180,120,40,0.08)', border: '1px solid rgba(180,120,40,0.25)', minWidth: '90px' }}>
                    <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: '#C0842A' }}>3.</p>
                    <p className="font-display text-sm sm:text-base font-bold" style={{ color: '#d4a060' }}>
                      {thirdPlace ? thirdPlace.name : '—'}
                    </p>
                  </div>
                  <div className="h-8 sm:h-10 w-full mt-2 rounded-t-lg" style={{ background: 'rgba(180,120,40,0.06)' }} />
                </motion.div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bracket */}
        <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <TournamentBracket matches={matches} />
          </motion.div>
        </div>
      </main>
    </div>
  )
}
