'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  targetDate: string
  location: string | null
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  isPast: boolean
}

function calcTimeLeft(targetDate: string): TimeLeft {
  const diff = new Date(targetDate).getTime() - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true }
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    isPast: false,
  }
}

function Digit({ value, label }: { value: number; label: string }) {
  const display = String(value).padStart(2, '0')
  return (
    <div className="flex flex-col items-center">
      <div
        className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center overflow-hidden"
        style={{ background: '#13131a', border: '1px solid #2a2a3a' }}
      >
        {/* Gold shimmer top line */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)' }} />
        <AnimatePresence mode="popLayout">
          <motion.span
            key={display}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="font-display text-4xl sm:text-5xl font-black tabular-nums"
            style={{ color: '#D4AF37' }}
          >
            {display}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="mt-2 text-xs font-semibold tracking-widest uppercase" style={{ color: '#6b6b8a' }}>
        {label}
      </span>
    </div>
  )
}

export default function Countdown({ targetDate, location }: Props) {
  const [time, setTime] = useState<TimeLeft>(() => calcTimeLeft(targetDate))

  useEffect(() => {
    const id = setInterval(() => setTime(calcTimeLeft(targetDate)), 1000)
    return () => clearInterval(id)
  }, [targetDate])

  // Format the target date nicely
  const formattedDate = new Date(targetDate).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  if (time.isPast) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-6"
      >
        <p className="font-display text-2xl font-bold" style={{ color: '#D4AF37' }}>
          🎲 Turnuva Başladı!
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="rounded-3xl py-10 px-6 text-center"
      style={{
        background: 'linear-gradient(135deg, #13131a 0%, #1a1a24 100%)',
        border: '1px solid #2a2a3a',
        boxShadow: '0 0 60px rgba(212,175,55,0.06)',
      }}
    >
      <p className="text-sm font-semibold tracking-widest uppercase mb-6" style={{ color: '#A08020' }}>
        Başlamasına Kalan Süre
      </p>

      <div className="flex items-end justify-center gap-4 sm:gap-6">
        <Digit value={time.days} label="Gün" />
        <span className="text-3xl font-bold mb-10 hidden sm:block" style={{ color: '#2a2a3a' }}>:</span>
        <Digit value={time.hours} label="Saat" />
        <span className="text-3xl font-bold mb-10" style={{ color: '#2a2a3a' }}>:</span>
        <Digit value={time.minutes} label="Dakika" />
        <span className="text-3xl font-bold mb-10" style={{ color: '#2a2a3a' }}>:</span>
        <Digit value={time.seconds} label="Saniye" />
      </div>

      <div className="mt-8 space-y-2">
        <div className="flex items-center justify-center gap-2 text-sm" style={{ color: '#6b6b8a' }}>
          <span>📅</span>
          <span>{formattedDate}</span>
        </div>
        {location && (
          <div className="flex items-center justify-center gap-2 text-sm" style={{ color: '#6b6b8a' }}>
            <span>📍</span>
            <span style={{ color: '#f0e6d3' }}>{location}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
