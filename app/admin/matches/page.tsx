'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import ScoreInput from '@/components/admin/ScoreInput'
import { Match } from '@/lib/types'

interface GroupWithMatches {
  id: string
  name: string
  matches: Match[]
}

export default function AdminMatches() {
  const [groups, setGroups] = useState<GroupWithMatches[]>([])
  const [knockoutMatches, setKnockoutMatches] = useState<Match[]>([])
  const [tab, setTab] = useState<'group' | 'knockout'>('group')
  const [generating, setGenerating] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [gRes, bRes] = await Promise.all([
      fetch('/api/groups'),
      fetch('/api/bracket'),
    ])
    const [gData, bData] = await Promise.all([gRes.json(), bRes.json()])
    const rawGroups = gData.groups ?? []
    setKnockoutMatches(bData.matches ?? [])

    // Fetch matches for each group
    const groupsWithMatches = await Promise.all(
      rawGroups.map(async (g: GroupWithMatches) => {
        const mRes = await fetch(`/api/groups/${g.id}/matches`)
        const mData = mRes.ok ? await mRes.json() : { matches: [] }
        return { ...g, matches: mData.matches ?? [] }
      })
    )
    setGroups(groupsWithMatches)
    setFetching(false)
  }

  async function handleScoreSave(matchId: string, score1: number, score2: number) {
    const res = await fetch(`/api/matches/${matchId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score1, score2 }),
    })
    if (res.ok) await loadData()
  }

  async function generateBracket() {
    setGenerating(true)
    const res = await fetch('/api/bracket', { method: 'POST' })
    if (res.ok) {
      await loadData()
      setTab('knockout')
    } else {
      const data = await res.json()
      alert(data.error || 'Bracket oluşturulamadı')
    }
    setGenerating(false)
  }

  const allGroupMatches = groups.flatMap(g => g.matches)
  const allGroupCompleted = allGroupMatches.length > 0 && allGroupMatches.every(m => m.status === 'completed')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold" style={{ color: '#D4AF37' }}>Maçlar</h1>
        <p className="mt-1" style={{ color: '#6b6b8a' }}>Skor giriş paneli</p>
      </div>

      <div className="flex gap-2 p-1 rounded-xl w-fit" style={{ background: '#13131a', border: '1px solid #2a2a3a' }}>
        {[{ key: 'group', label: 'Grup Aşaması' }, { key: 'knockout', label: 'Eleme' }].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as 'group' | 'knockout')}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={tab === t.key ? { background: '#D4AF37', color: '#0a0a0f' } : { color: '#6b6b8a' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {fetching ? (
        <div className="text-center py-10" style={{ color: '#6b6b8a' }}>Yükleniyor...</div>
      ) : tab === 'group' ? (
        <GroupMatchesPanel groups={groups} onSave={handleScoreSave} />
      ) : (
        <KnockoutPanel
          matches={knockoutMatches}
          onSave={handleScoreSave}
          onGenerate={generateBracket}
          generating={generating}
          allGroupCompleted={allGroupCompleted}
        />
      )}
    </div>
  )
}

function GroupMatchesPanel({ groups, onSave }: { groups: GroupWithMatches[]; onSave: (id: string, s1: number, s2: number) => Promise<void> }) {
  if (groups.length === 0) {
    return (
      <div className="text-center py-10" style={{ color: '#6b6b8a' }}>
        <p>Önce grupları oluşturun</p>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      {groups.map((group, gIdx) => (
        <motion.div
          key={group.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: gIdx * 0.05 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: '#13131a', border: '1px solid #2a2a3a' }}
        >
          <div className="px-5 py-3 font-display font-bold text-lg"
            style={{ background: '#1a1a24', color: '#D4AF37', borderBottom: '1px solid #2a2a3a' }}>
            Grup {group.name}
          </div>
          <div className="divide-y" style={{ borderColor: '#1f1f2e' }}>
            {group.matches.length === 0 ? (
              <p className="px-5 py-4 text-sm" style={{ color: '#6b6b8a' }}>Bu grupta maç yok</p>
            ) : group.matches.map(match => (
              <div key={match.id} className="px-5 py-4">
                <ScoreInput match={match} onSave={onSave} />
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function KnockoutPanel({ matches, onSave, onGenerate, generating, allGroupCompleted }: {
  matches: Match[]
  onSave: (id: string, s1: number, s2: number) => Promise<void>
  onGenerate: () => void
  generating: boolean
  allGroupCompleted: boolean
}) {
  const roundOrder = ['16\'lı Tur', '32\'li Tur', 'Çeyrek Final', 'Yarı Final', 'Final']
  const rounds = [...new Set(matches.map(m => m.round))].sort((a, b) => roundOrder.indexOf(a) - roundOrder.indexOf(b))

  if (matches.length === 0) {
    return (
      <div className="text-center py-10 space-y-4">
        <div className="text-4xl">🏆</div>
        <p style={{ color: '#6b6b8a' }}>Eleme bracketi henüz oluşturulmadı</p>
        {!allGroupCompleted && <p className="text-sm" style={{ color: '#6b6b8a' }}>Tüm grup maçlarını tamamlayın</p>}
        <button
          onClick={onGenerate}
          disabled={generating}
          className="px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-40 hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #D4AF37, #A08020)', color: '#0a0a0f' }}
        >
          {generating ? 'Oluşturuluyor...' : '⚡ Bracket Oluştur'}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={onGenerate} disabled={generating}
          className="text-sm px-4 py-2 rounded-lg transition-all disabled:opacity-40"
          style={{ background: '#1a1a24', color: '#6b6b8a', border: '1px solid #2a2a3a' }}>
          {generating ? '...' : '🔄 Yeniden Oluştur'}
        </button>
      </div>
      {rounds.map(round => {
        const roundMatches = matches.filter(m => m.round === round)
        return (
          <div key={round} className="rounded-2xl overflow-hidden" style={{ background: '#13131a', border: '1px solid #2a2a3a' }}>
            <div className="px-5 py-3 font-display font-bold text-lg"
              style={{ background: '#1a1a24', color: '#D4AF37', borderBottom: '1px solid #2a2a3a' }}>
              {round}
            </div>
            <div className="divide-y" style={{ borderColor: '#1f1f2e' }}>
              {roundMatches.map(match => (
                <div key={match.id} className="px-5 py-4">
                  <ScoreInput match={match} onSave={onSave} />
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
