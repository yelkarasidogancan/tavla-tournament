'use client'
export default function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase"
      style={{ background: 'rgba(192,57,43,0.15)', border: '1px solid #C0392B', color: '#E74C3C' }}>
      <span className="w-2 h-2 rounded-full bg-red-light pulse-red inline-block" style={{ backgroundColor: '#E74C3C' }} />
      Canlı
    </span>
  )
}
