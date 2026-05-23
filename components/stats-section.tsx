'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, useInView, useMotionValue, useMotionTemplate } from 'framer-motion'
import { ShieldCheck, Zap, Package, Star, LucideIcon } from 'lucide-react'
import { NumberTicker } from '@/components/magicui/number-ticker'

type Card = {
  icon: LucideIcon
  stat: number
  suffix?: string
  label: string
  description: string
}

function StatCard({
  card,
  index,
  isInView,
  loaded,
}: {
  card: Card
  index: number
  isInView: boolean
  loaded: boolean
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const spotlight = useMotionTemplate`radial-gradient(220px circle at ${mouseX}px ${mouseY}px, rgba(236,30,121,0.13), transparent 75%)`

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left)
    mouseY.set(e.clientY - rect.top)
  }

  const Icon = card.icon

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, y: 28 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.015] p-7 backdrop-blur-sm transition-shadow duration-300 hover:border-[#EC1E79]/30"
    >
      {/* spotlight */}
      <motion.div style={{ background: spotlight }} className="pointer-events-none absolute inset-0" />

      {/* top gradient line */}
      <div className="absolute inset-x-[20%] top-0 h-px bg-gradient-to-r from-transparent via-[#EC1E79]/60 to-transparent" />

      <div className="relative">
        <div className="mb-6 inline-flex size-12 items-center justify-center rounded-xl border border-[#EC1E79]/20 bg-[#EC1E79]/10">
          <Icon size={20} color="#EC1E79" strokeWidth={2} />
        </div>

        <div className="mb-1.5 text-[clamp(2.4rem,4vw,3.25rem)] font-black leading-none tracking-[-0.04em] text-white">
          {loaded ? (
            <>
              <NumberTicker value={card.stat} />
              {card.suffix && <span>{card.suffix}</span>}
            </>
          ) : (
            <span className="opacity-15">0</span>
          )}
        </div>

        <div className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-[#EC1E79]">
          {card.label}
        </div>

        <p className="m-0 text-[13px] leading-[1.6] text-white/35">{card.description}</p>
      </div>
    </motion.div>
  )
}

export function StatsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const [stats, setStats] = useState({ totalStock: 0, totalProducts: 0, totalOrders: 0 })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(data => {
        setStats(data)
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  const cards: Card[] = [
    {
      icon: Package,
      stat: stats.totalStock,
      suffix: '+',
      label: 'Cards in stock',
      description: 'Singles, slabs and sealed product ready to ship.',
    },
    {
      icon: ShieldCheck,
      stat: stats.totalProducts,
      label: 'Active listings',
      description: 'Every card individually checked. No bulk filler.',
    },
    {
      icon: Star,
      stat: stats.totalOrders,
      label: 'Orders shipped',
      description: 'Packed properly. UK and worldwide.',
    },
    {
      icon: Zap,
      stat: 24,
      suffix: 'h',
      label: 'Dispatch time',
      description: 'Order before midday, ships the same day.',
    },
  ]

  return (
    <section ref={ref} className="relative overflow-hidden bg-[#050505] py-20 sm:py-24">
      {/* background grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(236,30,121,0.03) 1px, transparent 1px),linear-gradient(90deg,rgba(236,30,121,0.03) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      {/* centre glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 size-[600px] -translate-x-1/2 -translate-y-1/2"
        style={{
          background: 'radial-gradient(ellipse, rgba(236,30,121,0.06) 0%, transparent 70%)',
        }}
      />

      <div className="relative mx-auto max-w-[1180px] px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.45 }}
          className="mb-12"
        >
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#EC1E79]/20 bg-[#EC1E79]/[0.07] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#EC1E79]">
            <span className="size-1.5 animate-pulse rounded-full bg-[#EC1E79]" />
            Live numbers
          </div>
          <h2 className="m-0 text-[clamp(1.85rem,3.6vw,2.85rem)] font-black leading-[1.1] tracking-[-0.035em] text-white">
            Why collectors choose
            <br />
            <span className="bg-gradient-to-r from-[#EC1E79] to-[#FF80B8] bg-clip-text text-transparent">
              Luton Cards
            </span>
            <span className="text-white">.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, i) => (
            <StatCard key={card.label} card={card} index={i} isInView={isInView} loaded={loaded} />
          ))}
        </div>
      </div>
    </section>
  )
}
