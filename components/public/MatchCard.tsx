'use client'
import { motion } from 'framer-motion'
import { Match } from '@/lib/types'

interface Props {
  match: Match
  compact?: boolean
}

function PlayerAvatar({ name }: { name: string }) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const hue = name.charCodeAt(0) * 17 % 360
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
      style={{ background: `hsl(${hue}, 50%, 25%)`, border: `1px solid hsl(${hue}, 50%, 40%)`, color: `hsl(${hue}, 80%, 75%)` }}
    >
      {initials}
    </div>
  )
}

export default function MatchCard({ match, compact }: Props) {
  const p1 = match.player1
  const p2 = match.player2
  const isCompleted = match.status === 'completed'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden"
      style={{ background: '#13131a', border: '1px solid #2a2a3a' }}
    >
      {!compact && match.round && (
        <div className="px-3 py-1.5 text-center text-xs font-medium tracking-wide"
          style={{ background: '#1a1a24', color: '#6b6b8a', borderBottom: '1px solid #2a2a3a' }}>
          {match.round} — Maç {match.match_number}
        </div>
      )}
      <div className="p-3 space-y-2">
        {/* Player 1 */}
        <div className={`flex items-center gap-2 justify-between ${isCompleted && match.winner_id === match.player1_id ? 'opacity-100' : isCompleted ? 'opacity-40' : 'opacity-100'}`}>
          <div className="flex items-center gap-2 min-w-0">
            {p1 ? <PlayerAvatar name={p1.name} /> : <div className="w-8 h-8 rounded-full bg-[#2a2a3a]" />}
            <span className={`text-sm font-medium truncate ${isCompleted && match.winner_id === match.player1_id ? 'text-[#D4AF37]' : 'text-[#f0e6d3]'}`}>
              {p1?.name ?? 'TBD'}
            </span>
          </div>
          {isCompleted && (
            <span className={`text-lg font-bold w-6 text-right ${match.winner_id === match.player1_id ? 'text-[#D4AF37]' : 'text-[#6b6b8a]'}`}>
              {match.score1}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 h-px" style={{ background: '#2a2a3a' }} />
          <span className="text-xs" style={{ color: '#6b6b8a' }}>{isCompleted ? 'Bitti' : 'vs'}</span>
          <div className="flex-1 h-px" style={{ background: '#2a2a3a' }} />
        </div>

        {/* Player 2 */}
        <div className={`flex items-center gap-2 justify-between ${isCompleted && match.winner_id === match.player2_id ? 'opacity-100' : isCompleted ? 'opacity-40' : 'opacity-100'}`}>
          <div className="flex items-center gap-2 min-w-0">
            {p2 ? <PlayerAvatar name={p2.name} /> : <div className="w-8 h-8 rounded-full bg-[#2a2a3a]" />}
            <span className={`text-sm font-medium truncate ${isCompleted && match.winner_id === match.player2_id ? 'text-[#D4AF37]' : 'text-[#f0e6d3]'}`}>
              {p2?.name ?? 'TBD'}
            </span>
          </div>
          {isCompleted && (
            <span className={`text-lg font-bold w-6 text-right ${match.winner_id === match.player2_id ? 'text-[#D4AF37]' : 'text-[#6b6b8a]'}`}>
              {match.score2}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
