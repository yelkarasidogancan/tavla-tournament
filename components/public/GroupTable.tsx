'use client'
import { motion } from 'framer-motion'
import { GroupWithPlayers } from '@/lib/types'
import { compareStandings } from '@/lib/tournament-logic'

interface Props {
  group: GroupWithPlayers
  advancesPerGroup: number
}

export default function GroupTable({ group, advancesPerGroup }: Props) {
  const sorted = [...group.group_players].sort((a, b) =>
    compareStandings(
      { playerId: a.player_id, wins: a.wins, losses: a.losses, scoreFor: a.score_for, scoreAgainst: a.score_against, points: a.points },
      { playerId: b.player_id, wins: b.wins, losses: b.losses, scoreFor: b.score_for, scoreAgainst: b.score_against, points: b.points }
    )
  )

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: '#13131a', border: '1px solid #2a2a3a' }}
    >
      <div className="px-5 py-4 flex items-center justify-between"
        style={{ background: '#1a1a24', borderBottom: '1px solid #2a2a3a' }}>
        <h3 className="font-display text-xl font-bold" style={{ color: '#D4AF37' }}>
          Grup {group.name}
        </h3>
        <span className="text-xs px-2 py-1 rounded-full" style={{ background: '#2a2a3a', color: '#6b6b8a' }}>
          {sorted.length} oyuncu
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid #2a2a3a' }}>
              <th className="text-left px-2 sm:px-4 py-2 font-medium w-8" style={{ color: '#6b6b8a' }}>#</th>
              <th className="text-left px-2 py-2 font-medium" style={{ color: '#6b6b8a' }}>Oyuncu</th>
              {/* Maç sayısı — mobilde gizle */}
              <th className="hidden sm:table-cell text-center px-2 py-2 font-medium" style={{ color: '#6b6b8a' }}>O</th>
              <th className="text-center px-2 py-2 font-medium" style={{ color: '#6b6b8a' }}>G</th>
              <th className="text-center px-2 py-2 font-medium" style={{ color: '#6b6b8a' }}>M</th>
              {/* Averaj — mobilde gizle */}
              <th className="hidden sm:table-cell text-center px-2 py-2 font-medium" style={{ color: '#6b6b8a' }}>Av</th>
              <th className="text-center px-2 sm:px-4 py-2 font-bold" style={{ color: '#D4AF37' }}>Puan</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((gp, idx) => {
              const isAdvancing = idx < advancesPerGroup
              const scoreDiff = gp.score_for - gp.score_against
              return (
                <motion.tr
                  key={gp.player_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="transition-colors hover:bg-[#1a1a24]"
                  style={{
                    borderBottom: '1px solid #1a1a24',
                    borderLeft: isAdvancing ? '3px solid #D4AF37' : '3px solid transparent',
                  }}
                >
                  <td className="px-2 sm:px-4 py-2.5 sm:py-3 font-bold text-center" style={{ color: isAdvancing ? '#D4AF37' : '#6b6b8a' }}>
                    {idx + 1}
                  </td>
                  <td className="px-2 py-2.5 sm:py-3">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <PlayerDot name={gp.player?.name ?? ''} />
                      <span className="font-medium truncate max-w-[100px] sm:max-w-none" style={{ color: isAdvancing ? '#f0e6d3' : '#a0a0b8' }}>
                        {gp.player?.name ?? '—'}
                      </span>
                      {isAdvancing && (
                        <span className="flex-shrink-0 text-xs px-1 py-0.5 rounded" style={{ background: 'rgba(212,175,55,0.15)', color: '#D4AF37' }}>
                          ↑
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="hidden sm:table-cell text-center px-2 py-2.5 sm:py-3" style={{ color: '#6b6b8a' }}>{gp.wins + gp.losses}</td>
                  <td className="text-center px-2 py-2.5 sm:py-3" style={{ color: '#4ade80' }}>{gp.wins}</td>
                  <td className="text-center px-2 py-2.5 sm:py-3" style={{ color: '#f87171' }}>{gp.losses}</td>
                  <td className="hidden sm:table-cell text-center px-2 py-2.5 sm:py-3" style={{ color: scoreDiff > 0 ? '#4ade80' : scoreDiff < 0 ? '#f87171' : '#6b6b8a' }}>
                    {scoreDiff > 0 ? '+' : ''}{scoreDiff}
                  </td>
                  <td className="text-center px-2 sm:px-4 py-2.5 sm:py-3 font-bold" style={{ color: isAdvancing ? '#D4AF37' : '#f0e6d3' }}>
                    {gp.points}
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}

function PlayerDot({ name }: { name: string }) {
  const hue = name.charCodeAt(0) * 17 % 360
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
      style={{ background: `hsl(${hue}, 50%, 20%)`, border: `1px solid hsl(${hue}, 50%, 35%)`, color: `hsl(${hue}, 80%, 70%)` }}>
      {initials}
    </div>
  )
}
