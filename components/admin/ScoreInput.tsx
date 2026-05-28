'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Match } from '@/lib/types'

interface Props {
  match: Match
  onSave: (matchId: string, score1: number, score2: number) => Promise<void>
}

export default function ScoreInput({ match, onSave }: Props) {
  const [s1, setS1] = useState(match.score1?.toString() ?? '')
  const [s2, setS2] = useState(match.score2?.toString() ?? '')
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)

  const isCompleted = match.status === 'completed'

  async function handleSave() {
    const n1 = parseInt(s1)
    const n2 = parseInt(s2)
    if (isNaN(n1) || isNaN(n2) || n1 < 0 || n2 < 0) return
    if (n1 === n2) { alert('Eşitlik olamaz, birinin kazanması gerekiyor'); return }
    setSaving(true)
    await onSave(match.id, n1, n2)
    setSaving(false)
    setEditing(false)
  }

  if (isCompleted && !editing) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm" style={{ color: '#6b6b8a' }}>
          {match.player1?.name}: <strong style={{ color: '#D4AF37' }}>{match.score1}</strong>
          {' — '}
          {match.player2?.name}: <strong style={{ color: '#D4AF37' }}>{match.score2}</strong>
        </span>
        <button onClick={() => setEditing(true)} className="text-xs px-2 py-1 rounded"
          style={{ background: '#2a2a3a', color: '#6b6b8a' }}>Düzenle</button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm font-medium truncate max-w-[100px]" style={{ color: '#f0e6d3' }}>
        {match.player1?.name ?? 'TBD'}
      </span>
      <input
        type="number" min="0" value={s1} onChange={e => setS1(e.target.value)}
        className="w-14 text-center rounded-lg px-2 py-1 text-sm font-bold outline-none"
        style={{ background: '#1a1a24', border: '1px solid #2a2a3a', color: '#D4AF37' }}
        placeholder="0"
      />
      <span style={{ color: '#6b6b8a' }}>:</span>
      <input
        type="number" min="0" value={s2} onChange={e => setS2(e.target.value)}
        className="w-14 text-center rounded-lg px-2 py-1 text-sm font-bold outline-none"
        style={{ background: '#1a1a24', border: '1px solid #2a2a3a', color: '#D4AF37' }}
        placeholder="0"
      />
      <span className="text-sm font-medium truncate max-w-[100px]" style={{ color: '#f0e6d3' }}>
        {match.player2?.name ?? 'TBD'}
      </span>
      <button
        onClick={handleSave}
        disabled={saving || !s1 || !s2}
        className="px-3 py-1 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-40"
        style={{ background: '#D4AF37', color: '#0a0a0f' }}
      >
        {saving ? '...' : 'Kaydet'}
      </button>
      {editing && (
        <button onClick={() => setEditing(false)} className="text-xs px-2 py-1 rounded"
          style={{ background: '#2a2a3a', color: '#6b6b8a' }}>İptal</button>
      )}
    </div>
  )
}
