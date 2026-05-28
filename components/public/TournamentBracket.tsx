'use client'
import { motion } from 'framer-motion'
import { Match } from '@/lib/types'

interface Props {
  matches: Match[]
}

const THIRD_PLACE_ROUND = '3. lük Maçı'

// Tur sıralama önceliği — en geniş tur solda, Final en sağda
const ROUND_ORDER = ["32'li Tur", "16'lı Tur", 'Çeyrek Final', 'Yarı Final', 'Final']

function BracketMatchCard({
  match,
  delay,
  accent = '#D4AF37',
}: {
  match: Match
  delay: number
  accent?: string
}) {
  const p1 = match.player1
  const p2 = match.player2
  const isCompleted = match.status === 'completed'

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      className="w-52 rounded-xl overflow-hidden flex-shrink-0"
      style={{ background: '#13131a', border: `1px solid ${isCompleted ? accent : '#2a2a3a'}` }}
    >
      <div className="px-3 py-1 text-center text-xs" style={{ background: '#1a1a24', color: '#6b6b8a', borderBottom: '1px solid #2a2a3a' }}>
        Maç {match.match_number}
      </div>
      {[
        { player: p1, score: match.score1, id: match.player1_id },
        { player: p2, score: match.score2, id: match.player2_id },
      ].map((side, i) => (
        <div key={i}>
          {i === 1 && <div style={{ height: '1px', background: '#2a2a3a' }} />}
          <div className={`flex items-center justify-between px-3 py-2.5 ${isCompleted && match.winner_id !== side.id ? 'opacity-40' : ''}`}>
            <div className="flex items-center gap-2 min-w-0">
              {side.player ? (
                <Avatar name={side.player.name} size={24} />
              ) : (
                <div className="w-6 h-6 rounded-full bg-[#2a2a3a] flex-shrink-0" />
              )}
              <span className={`text-xs font-medium truncate ${isCompleted && match.winner_id === side.id ? '' : 'text-[#f0e6d3]'}`}
                style={isCompleted && match.winner_id === side.id ? { color: accent } : undefined}>
                {side.player?.name ?? 'TBD'}
              </span>
            </div>
            {isCompleted && (
              <span className="text-sm font-bold ml-1 flex-shrink-0"
                style={{ color: match.winner_id === side.id ? accent : '#6b6b8a' }}>
                {side.score}
              </span>
            )}
          </div>
        </div>
      ))}
    </motion.div>
  )
}

function Avatar({ name, size }: { name: string; size: number }) {
  const hue = name.charCodeAt(0) * 17 % 360
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold flex-shrink-0"
      style={{
        width: size, height: size, fontSize: size * 0.35,
        background: `hsl(${hue}, 50%, 22%)`,
        border: `1px solid hsl(${hue}, 50%, 38%)`,
        color: `hsl(${hue}, 80%, 72%)`,
      }}
    >
      {initials}
    </div>
  )
}

export default function TournamentBracket({ matches }: Props) {
  const mainMatches = matches.filter(m => m.round !== THIRD_PLACE_ROUND)
  const thirdPlaceMatches = matches.filter(m => m.round === THIRD_PLACE_ROUND)
  const thirdPlace = thirdPlaceMatches[0] ?? null

  const rounds = [...new Set(mainMatches.map(m => m.round))].sort(
    (a, b) => ROUND_ORDER.indexOf(a) - ROUND_ORDER.indexOf(b)
  )

  if (rounds.length === 0 && !thirdPlace) {
    return (
      <div className="text-center py-20" style={{ color: '#6b6b8a' }}>
        <div className="text-6xl mb-4">🎲</div>
        <p className="text-lg">Bracket henüz oluşturulmadı</p>
        <p className="text-sm mt-2">Grup aşaması tamamlandıktan sonra bracket oluşturulur</p>
      </div>
    )
  }

  // 3. lük kazananı
  const thirdPlaceWinner = thirdPlace?.status === 'completed' ? thirdPlace.winner : null

  return (
    <div className="space-y-10">
      {/* Ana bracket */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-8 min-w-max px-4">
          {rounds.map((round, rIdx) => {
            const roundMatches = mainMatches
              .filter(m => m.round === round)
              .sort((a, b) => a.match_number - b.match_number)

            return (
              <div key={round} className="flex flex-col">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: rIdx * 0.1 }}
                  className="text-center mb-6 pb-3 font-display text-lg font-semibold"
                  style={{ color: '#D4AF37', borderBottom: '1px solid #2a2a3a' }}
                >
                  {round}
                </motion.div>
                <div className="flex flex-col justify-around flex-1 gap-4">
                  {roundMatches.map((match, mIdx) => (
                    <BracketMatchCard
                      key={match.id}
                      match={match}
                      delay={rIdx * 0.15 + mIdx * 0.08}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 3. lük maçı — ayrı bölüm */}
      {thirdPlace && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="px-4"
        >
          {/* Ayraç */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px" style={{ background: '#2a2a3a' }} />
            <span className="text-sm font-semibold tracking-wide px-3 py-1 rounded-full"
              style={{ background: 'rgba(180,120,40,0.15)', color: '#C0842A', border: '1px solid rgba(180,120,40,0.3)' }}>
              🥉 3. lük Maçı
            </span>
            <div className="flex-1 h-px" style={{ background: '#2a2a3a' }} />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <BracketMatchCard match={thirdPlace} delay={0.5} accent="#C0842A" />

            {/* Kazanan — 3. oldu */}
            {thirdPlaceWinner && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 }}
                className="flex items-center gap-3 px-5 py-4 rounded-2xl"
                style={{ background: 'rgba(180,120,40,0.1)', border: '1px solid rgba(180,120,40,0.35)' }}
              >
                <span className="text-3xl">🥉</span>
                <div>
                  <p className="text-xs font-semibold tracking-widest uppercase mb-0.5" style={{ color: '#C0842A' }}>
                    3. Sıra
                  </p>
                  <p className="font-display text-lg font-bold" style={{ color: '#f0e6d3' }}>
                    {thirdPlaceWinner.name}
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}
