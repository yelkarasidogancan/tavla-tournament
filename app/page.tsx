'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import LiveBadge from '@/components/public/LiveBadge'
import MatchCard from '@/components/public/MatchCard'
import Countdown from '@/components/public/Countdown'
import { Tournament, Match, GroupWithPlayers } from '@/lib/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function HomePage() {
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [recentMatches, setRecentMatches] = useState<Match[]>([])
  const [allKnockoutMatches, setAllKnockoutMatches] = useState<Match[]>([])
  const [groups, setGroups] = useState<GroupWithPlayers[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()

    const channel = supabase
      .channel('home-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournaments' }, loadData)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function loadData() {
    try {
      const [tRes, bRes, gRes] = await Promise.all([
        fetch('/api/tournament'),
        fetch('/api/bracket'),
        fetch('/api/groups'),
      ])
      const [tData, bData, gData] = await Promise.all([tRes.json(), bRes.json(), gRes.json()])

      setTournament(tData.tournament)
      setGroups(gData.groups ?? [])

      const knockout: Match[] = bData.matches ?? []
      setAllKnockoutMatches(knockout)
      const recentKnockout = knockout.filter(m => m.status === 'completed').slice(-3)
      setRecentMatches(recentKnockout)
    } catch (err) {
      console.error('Veri yüklenirken hata oluştu:', err)
    } finally {
      setLoading(false)
    }
  }

  const isDraft = !tournament || tournament.status === 'draft'
  const isPublished = tournament?.status === 'published'
  const isCompleted = tournament?.status === 'completed'
  // Şampiyon: tüm knockout maçlarından Final'i bul (slice(-3) gibi yaklaşımlar büyük bracket'ta Final'i dışarıda bırakabilir)
  const champion = allKnockoutMatches.find(m => m.round === 'Final' && m.status === 'completed')?.winner

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          className="text-5xl"
        >
          🎲
        </motion.div>
      </div>
    )
  }

  if (isDraft) {
    return <ComingSoonPage tournament={tournament} />
  }

  const totalPlayers = groups.reduce((sum, g) => sum + g.group_players.length, 0)
  const completedGroupMatches = groups.reduce((sum, g) => {
    const ms = (g as GroupWithPlayers & { matches?: Match[] }).matches
    return sum + (ms?.filter(m => m.status === 'completed').length ?? 0)
  }, 0)

  return (
    <div className="min-h-screen bg-board-pattern" style={{ background: '#0a0a0f' }}>
      {/* Header */}
      <header className="sticky top-0 z-50" style={{ background: 'rgba(10,10,15,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #2a2a3a' }}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl">🎲</span>
            <h1 className="font-display text-xl font-bold truncate" style={{ color: '#D4AF37' }}>
              {tournament?.name}
            </h1>
            {isPublished && <LiveBadge />}
            {isCompleted && (
              <span className="text-xs px-2 py-1 rounded-full font-medium"
                style={{ background: 'rgba(212,175,55,0.15)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)' }}>
                Tamamlandı
              </span>
            )}
          </div>
          <nav className="flex items-center gap-2 flex-shrink-0">
            <Link href="/groups"
              className="text-sm px-4 py-2 rounded-lg transition-all hover:scale-105 font-medium"
              style={{ background: '#13131a', color: '#f0e6d3', border: '1px solid #2a2a3a' }}>
              Gruplar
            </Link>
            <Link href="/bracket"
              className="text-sm px-4 py-2 rounded-lg transition-all hover:scale-105 font-bold"
              style={{ background: 'linear-gradient(135deg, #D4AF37, #A08020)', color: '#0a0a0f' }}>
              Bracket
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-10 space-y-8 sm:space-y-12">
        {/* Champion banner */}
        <AnimatePresence>
          {champion && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center rounded-3xl py-12 px-8"
              style={{
                background: 'linear-gradient(135deg, rgba(212,175,55,0.12), rgba(160,128,32,0.06))',
                border: '2px solid #D4AF37',
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-7xl mb-4"
              >🏆</motion.div>
              <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: '#A08020' }}>
                Turnuva Şampiyonu
              </p>
              <h2 className="font-display text-5xl font-black gold-shimmer">{champion.name}</h2>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight" style={{ color: '#f0e6d3' }}>
            Turnuva <span className="gold-shimmer">Canlı</span>
          </h2>
          <p className="mt-3 text-base sm:text-lg" style={{ color: '#6b6b8a' }}>
            {totalPlayers} oyuncu · {groups.length} grup · Gerçek zamanlı takip
          </p>
          {tournament?.location && (
            <p className="mt-2 flex items-center justify-center gap-1.5 text-sm" style={{ color: '#a0a0b8' }}>
              <span>📍</span>
              <span style={{ color: '#f0e6d3' }}>{tournament.location}</span>
            </p>
          )}
        </motion.div>

        {/* Countdown — show only if date is in the future */}
        {tournament?.tournament_date && new Date(tournament.tournament_date) > new Date() && (
          <Countdown targetDate={tournament.tournament_date} location={tournament.location} />
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Oyuncu', value: totalPlayers, icon: '👥' },
            { label: 'Grup', value: groups.length, icon: '🏷️' },
            { label: 'Biten Maç', value: completedGroupMatches, icon: '✅' },
            { label: 'Grup Boyutu', value: tournament?.group_size ?? '—', icon: '⚡' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="rounded-2xl p-5 text-center"
              style={{ background: '#13131a', border: '1px solid #2a2a3a' }}
            >
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className="text-3xl font-bold mb-1" style={{ color: '#D4AF37' }}>{s.value}</div>
              <div className="text-xs" style={{ color: '#6b6b8a' }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="grid grid-cols-2 sm:flex sm:flex-row gap-3 sm:gap-4 justify-center">
          <Link href="/groups"
            className="flex items-center justify-center gap-2 px-4 sm:px-8 py-3 sm:py-4 rounded-2xl text-sm sm:text-base font-semibold transition-all active:scale-95 hover:scale-105"
            style={{ background: '#13131a', color: '#f0e6d3', border: '1px solid #2a2a3a' }}>
            📊 Gruplar
          </Link>
          <Link href="/bracket"
            className="flex items-center justify-center gap-2 px-4 sm:px-8 py-3 sm:py-4 rounded-2xl text-sm sm:text-base font-bold transition-all active:scale-95 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #D4AF37, #A08020)',
              color: '#0a0a0f',
              boxShadow: '0 0 30px rgba(212,175,55,0.25)',
            }}>
            🏆 Bracket
          </Link>
        </div>

        {/* Recent matches */}
        {recentMatches.length > 0 && (
          <div>
            <h3 className="font-display text-2xl font-bold mb-5" style={{ color: '#f0e6d3' }}>
              Son Maçlar
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentMatches.map(match => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </div>
        )}

        {/* Groups preview */}
        {groups.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-2xl font-bold" style={{ color: '#f0e6d3' }}>Gruplar</h3>
              <Link href="/groups" className="text-sm" style={{ color: '#D4AF37' }}>Tümünü gör →</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {groups.map((group, idx) => {
                const advancesCount = tournament?.advances_per_group ?? 2
                // Spread ile kopyala — state array'ini yerinde mutate etmemek için
                const sortedPlayers = [...group.group_players].sort((a, b) => b.points - a.points)
                return (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.04 }}
                    className="rounded-xl overflow-hidden"
                    style={{ background: '#13131a', border: '1px solid #2a2a3a' }}
                  >
                    <div className="px-3 py-2 text-center font-display font-bold text-sm"
                      style={{ background: '#1a1a24', color: '#D4AF37', borderBottom: '1px solid #2a2a3a' }}>
                      Grup {group.name}
                    </div>
                    <div className="p-2 space-y-1">
                      {sortedPlayers
                        .map((gp, rank) => (
                          <div key={gp.player_id} className="flex items-center gap-1.5 text-xs">
                            <span className="w-3 font-bold" style={{ color: rank < advancesCount ? '#D4AF37' : '#6b6b8a' }}>
                              {rank + 1}
                            </span>
                            <span className="truncate" style={{ color: rank < advancesCount ? '#f0e6d3' : '#6b6b8a' }}>
                              {gp.player?.name}
                            </span>
                            <span className="ml-auto font-bold" style={{ color: '#D4AF37' }}>{gp.points}</span>
                          </div>
                        ))}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-20 py-8 text-center text-sm" style={{ borderTop: '1px solid #2a2a3a', color: '#6b6b8a' }}>
        🎲 Tavla Turnuvası — Gerçek zamanlı takip sistemi
      </footer>
    </div>
  )
}

interface GroupFixture {
  id: string
  name: string
  group_players: { player: { id: string; name: string } }[]
  matches: {
    id: string
    match_number: number
    status: string
    player1: { id: string; name: string } | null
    player2: { id: string; name: string } | null
  }[]
}

function RegistrationForm({ tournamentId }: { tournamentId: string }) {
  const STORAGE_KEY = `reg_done_${tournamentId}`
  const [regName, setRegName] = useState('')
  const [apartment, setApartment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY)) setDone(true)
  }, [STORAGE_KEY])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const res = await fetch('/api/registrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: regName, apartment }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Bir hata oluştu')
    } else {
      localStorage.setItem(STORAGE_KEY, '1')
      setDone(true)
    }
    setSubmitting(false)
  }

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl p-6 text-center"
        style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.3)' }}
      >
        <div className="text-3xl mb-2">✅</div>
        <p className="font-semibold" style={{ color: '#D4AF37' }}>Kaydınız alındı!</p>
        <p className="text-sm mt-1" style={{ color: '#6b6b8a' }}>Admin sizi listeye ekleyecek.</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: '#13131a', border: '1px solid #2a2a3a' }}
    >
      <div className="px-5 py-4" style={{ background: '#1a1a24', borderBottom: '1px solid #2a2a3a' }}>
        <h3 className="font-display text-lg font-bold" style={{ color: '#D4AF37' }}>
          🎯 Katılım Formu
        </h3>
        <p className="text-xs mt-0.5" style={{ color: '#6b6b8a' }}>
          Turnuvaya katılmak istiyorsan kaydol
        </p>
      </div>
      <form onSubmit={handleSubmit} className="p-5 space-y-3">
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#6b6b8a' }}>
            Ad Soyad
          </label>
          <input
            value={regName}
            onChange={e => setRegName(e.target.value)}
            placeholder="Adın Soyadın"
            required
            className="w-full px-4 py-2.5 rounded-xl outline-none text-sm"
            style={{ background: '#0a0a0f', border: '1px solid #2a2a3a', color: '#f0e6d3' }}
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#6b6b8a' }}>
            Daire Numarası
          </label>
          <input
            value={apartment}
            onChange={e => setApartment(e.target.value)}
            placeholder="örn. 12, B-3, 4/A"
            required
            className="w-full px-4 py-2.5 rounded-xl outline-none text-sm"
            style={{ background: '#0a0a0f', border: '1px solid #2a2a3a', color: '#f0e6d3' }}
          />
        </div>
        {error && (
          <p className="text-xs px-1" style={{ color: '#E74C3C' }}>{error}</p>
        )}
        <button
          type="submit"
          disabled={submitting || !regName.trim() || !apartment.trim()}
          className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 hover:scale-[1.02]"
          style={{ background: 'linear-gradient(135deg, #D4AF37, #A08020)', color: '#0a0a0f' }}
        >
          {submitting ? 'Kaydediliyor...' : 'Katılmak İstiyorum →'}
        </button>
      </form>
    </motion.div>
  )
}

function ComingSoonPage({ tournament }: { tournament: Tournament | null }) {
  const [groups, setGroups] = useState<GroupFixture[]>([])
  const [isRevealed, setIsRevealed] = useState(() =>
    tournament?.tournament_date ? new Date(tournament.tournament_date) <= new Date() : false
  )

  useEffect(() => {
    fetch('/api/groups').then(r => r.json()).then(d => setGroups(d.groups ?? []))
  }, [])

  useEffect(() => {
    if (!tournament?.tournament_date || isRevealed) return
    const id = setInterval(() => {
      if (new Date(tournament.tournament_date!) <= new Date()) {
        setIsRevealed(true)
        clearInterval(id)
      }
    }, 500)
    return () => clearInterval(id)
  }, [tournament?.tournament_date, isRevealed])

  return (
    <div className="min-h-screen bg-board-pattern" style={{ background: '#0a0a0f' }}>
      <div className="max-w-4xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            animate={isRevealed ? { scale: [1, 1.3, 1] } : { rotate: [0, 10, -10, 0] }}
            transition={{ repeat: isRevealed ? 0 : Infinity, duration: isRevealed ? 0.5 : 3 }}
            className="text-8xl mb-8 inline-block"
          >
            🎲
          </motion.div>

          <h1 className="font-display text-5xl font-black mb-3" style={{ color: '#f0e6d3' }}>
            {tournament?.name ?? 'Tavla Turnuvası'}
          </h1>

          <AnimatePresence mode="wait">
            {!isRevealed ? (
              <motion.div key="waiting" exit={{ opacity: 0, y: -10 }}>
                <h2 className="font-display text-3xl font-bold mb-4">
                  <span className="gold-shimmer">Hazırlanıyor</span>
                </h2>
                <p className="text-lg" style={{ color: '#6b6b8a' }}>
                  Çok yakında yayına giriyor. Heyecanını hazırla!
                </p>
              </motion.div>
            ) : (
              <motion.div key="revealed" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h2 className="font-display text-3xl font-bold mb-4">
                  <span className="gold-shimmer">Kura Çekildi!</span>
                </h2>
                <p className="text-lg" style={{ color: '#6b6b8a' }}>
                  İşte gruplar ve ilk tur eşleşmeleri 👇
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Countdown / Revealed state */}
        {tournament?.tournament_date && !isRevealed && (
          <div className="mb-8">
            <Countdown targetDate={tournament.tournament_date} location={tournament.location} />
          </div>
        )}

        {/* Location only (no date) */}
        {tournament?.location && !tournament.tournament_date && (
          <p className="flex items-center justify-center gap-2 text-sm mb-8" style={{ color: '#6b6b8a' }}>
            <span>📍</span>
            <span style={{ color: '#f0e6d3' }}>{tournament.location}</span>
          </p>
        )}

        {/* Kayıt formu — sadece geri sayım devam ederken göster */}
        {!isRevealed && tournament?.id && (
          <div className="max-w-md mx-auto mb-12">
            <RegistrationForm tournamentId={tournament.id} />
          </div>
        )}

        {/* Fixture reveal after countdown */}
        <AnimatePresence>
          {isRevealed && groups.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {/* Date + location banner */}
              {(tournament?.tournament_date || tournament?.location) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-wrap items-center justify-center gap-6 mb-10 py-4 px-6 rounded-2xl"
                  style={{ background: '#13131a', border: '1px solid #2a2a3a' }}
                >
                  {tournament.tournament_date && (
                    <span className="flex items-center gap-2 text-sm" style={{ color: '#f0e6d3' }}>
                      <span>📅</span>
                      {new Date(tournament.tournament_date).toLocaleDateString('tr-TR', {
                        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  )}
                  {tournament.location && (
                    <span className="flex items-center gap-2 text-sm" style={{ color: '#f0e6d3' }}>
                      <span>📍</span>{tournament.location}
                    </span>
                  )}
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {groups.map((group, gIdx) => (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: gIdx * 0.12, duration: 0.5, ease: 'easeOut' }}
                    className="rounded-2xl overflow-hidden"
                    style={{ background: '#13131a', border: '1px solid #2a2a3a' }}
                  >
                    {/* Group header */}
                    <div className="px-5 py-4 flex items-center justify-between"
                      style={{ background: 'linear-gradient(135deg, #1a1a24, #13131a)', borderBottom: '1px solid #2a2a3a' }}>
                      <h3 className="font-display text-xl font-bold" style={{ color: '#D4AF37' }}>
                        Grup {group.name}
                      </h3>
                      <span className="text-xs px-2 py-1 rounded-full" style={{ background: '#2a2a3a', color: '#6b6b8a' }}>
                        {group.group_players.length} oyuncu
                      </span>
                    </div>

                    {/* Players */}
                    <div className="px-5 py-3 space-y-2" style={{ borderBottom: '1px solid #2a2a3a' }}>
                      {group.group_players.map((gp, i) => {
                        const hue = gp.player.name.charCodeAt(0) * 17 % 360
                        const initials = gp.player.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                        return (
                          <motion.div
                            key={gp.player.id}
                            initial={{ opacity: 0, x: -15 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: gIdx * 0.12 + i * 0.06 }}
                            className="flex items-center gap-3"
                          >
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{ background: `hsl(${hue},50%,22%)`, border: `1px solid hsl(${hue},50%,38%)`, color: `hsl(${hue},80%,72%)` }}>
                              {initials}
                            </div>
                            <span className="font-medium text-sm" style={{ color: '#f0e6d3' }}>{gp.player.name}</span>
                          </motion.div>
                        )
                      })}
                    </div>

                    {/* Matches */}
                    {group.matches.length > 0 && (
                      <div className="px-5 py-3">
                        <p className="text-xs font-semibold tracking-wide uppercase mb-3" style={{ color: '#6b6b8a' }}>
                          Eşleşmeler
                        </p>
                        <div className="space-y-2">
                          {[...group.matches]
                            .sort((a, b) => a.match_number - b.match_number)
                            .map((match, mIdx) => (
                              <motion.div
                                key={match.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: gIdx * 0.12 + 0.3 + mIdx * 0.05 }}
                                className="flex items-center gap-2 text-sm py-1.5 px-3 rounded-lg"
                                style={{ background: '#1a1a24' }}
                              >
                                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                  style={{ background: '#2a2a3a', color: '#6b6b8a' }}>
                                  {match.match_number}
                                </span>
                                <span className="font-medium truncate" style={{ color: '#f0e6d3' }}>
                                  {match.player1?.name ?? '?'}
                                </span>
                                <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded font-bold"
                                  style={{ background: 'rgba(212,175,55,0.15)', color: '#D4AF37' }}>
                                  vs
                                </span>
                                <span className="font-medium truncate" style={{ color: '#f0e6d3' }}>
                                  {match.player2?.name ?? '?'}
                                </span>
                              </motion.div>
                            ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dice animation when waiting */}
        {!isRevealed && (
          <div className="flex justify-center gap-3 mt-10">
            {['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'].map((d, i) => (
              <motion.span
                key={i}
                className="text-3xl"
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.15 }}
                style={{ color: '#D4AF37' }}
              >
                {d}
              </motion.span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
