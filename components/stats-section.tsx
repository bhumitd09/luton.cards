'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, useInView, useMotionValue, useMotionTemplate } from 'framer-motion'
import { ShieldCheck, Zap, Package, Star } from 'lucide-react'

function CountUp({ target, suffix, isInView }: { target: number; suffix: string; isInView: boolean }) {
  const [current, setCurrent] = useState(0)
  useEffect(() => {
    if (!isInView || target === 0) return
    const steps = 60
    const increment = target / steps
    let step = 0
    const timer = setInterval(() => {
      step++
      setCurrent(Math.min(Math.round(increment * step), target))
      if (step >= steps) clearInterval(timer)
    }, 1800 / steps)
    return () => clearInterval(timer)
  }, [isInView, target])
  if (target === 0) return <span>0</span>
  return <span>{current.toLocaleString()}{suffix}</span>
}

function FeatureCard({
  icon: Icon,
  stat,
  suffix,
  label,
  description,
  index,
  isInView,
  loaded,
}: {
  icon: React.ElementType
  stat: number
  suffix: string
  label: string
  description: string
  index: number
  isInView: boolean
  loaded: boolean
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const spotlight = useMotionTemplate`radial-gradient(220px circle at ${mouseX}px ${mouseY}px, rgba(236,30,121,0.12), transparent 80%)`

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left)
    mouseY.set(e.clientY - rect.top)
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.1, duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -6, transition: { type: 'spring', stiffness: 280, damping: 18 } }}
      style={{
        position: 'relative',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '20px',
        padding: '2rem 1.75rem',
        cursor: 'default',
        overflow: 'hidden',
      }}
    >
      {/* Spotlight */}
      <motion.div style={{ background: spotlight, position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: '20px' }} />

      {/* Top glow line */}
      <div style={{
        position: 'absolute',
        top: 0, left: '20%', right: '20%',
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(236,30,121,0.6), transparent)',
      }} />

      {/* Icon */}
      <div style={{
        width: '48px', height: '48px',
        borderRadius: '14px',
        background: 'rgba(236,30,121,0.1)',
        border: '1px solid rgba(236,30,121,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '1.5rem',
      }}>
        <Icon size={22} color="#EC1E79" strokeWidth={2} />
      </div>

      {/* Stat */}
      <div style={{
        fontSize: 'clamp(2.5rem, 4vw, 3.25rem)',
        fontWeight: 900,
        color: '#fff',
        letterSpacing: '-0.04em',
        lineHeight: 1,
        marginBottom: '0.35rem',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {loaded ? (
          <CountUp target={stat} suffix={suffix} isInView={isInView} />
        ) : (
          <span style={{ opacity: 0.15 }}>0</span>
        )}
      </div>

      {/* Label */}
      <div style={{
        fontSize: '0.8125rem',
        fontWeight: 700,
        color: '#EC1E79',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        marginBottom: '0.6rem',
      }}>
        {label}
      </div>

      {/* Description */}
      <p style={{
        fontSize: '0.8125rem',
        color: 'rgba(255,255,255,0.3)',
        lineHeight: 1.6,
        margin: 0,
      }}>
        {description}
      </p>
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
      .then(data => { setStats(data); setLoaded(true) })
      .catch(() => setLoaded(true))
  }, [])

  const cards = [
    {
      icon: Package,
      stat: stats.totalStock,
      suffix: '+',
      label: 'Cards in stock',
      description: 'Fresh inventory updated daily. Singles, slabs and sealed product ready to ship.',
    },
    {
      icon: ShieldCheck,
      stat: stats.totalProducts,
      suffix: '',
      label: 'Active listings',
      description: 'Every card individually checked and listed honestly. No bulk filler.',
    },
    {
      icon: Star,
      stat: stats.totalOrders,
      suffix: '',
      label: 'Orders shipped',
      description: 'From UK collectors to worldwide. Packaged properly, every time.',
    },
    {
      icon: Zap,
      stat: 24,
      suffix: 'h',
      label: 'Dispatch time',
      description: 'Order before midday and we ship same day. Fast tracked as standard.',
    },
  ]

  return (
    <section
      ref={ref}
      style={{
        padding: '6rem 0',
        background: '#050505',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background grid pattern */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(rgba(236,30,121,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(236,30,121,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
      }} />

      {/* Radial glow centre */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px', height: '400px',
        background: 'radial-gradient(ellipse, rgba(236,30,121,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div className="container" style={{ position: 'relative' }}>
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: '3.5rem' }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            background: 'rgba(236,30,121,0.08)',
            border: '1px solid rgba(236,30,121,0.2)',
            color: '#EC1E79',
            padding: '0.3rem 0.875rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '1rem',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EC1E79', display: 'inline-block' }} />
            Live numbers
          </div>
          <h2 style={{
            fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)',
            fontWeight: 900,
            color: '#fff',
            letterSpacing: '-0.035em',
            margin: 0,
            lineHeight: 1.1,
          }}>
            Why collectors choose<br />
            <span style={{ color: '#EC1E79' }}>Luton Cards</span>
          </h2>
        </motion.div>

        {/* Cards grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
        }}>
          {cards.map((card, i) => (
            <FeatureCard
              key={card.label}
              {...card}
              index={i}
              isInView={isInView}
              loaded={loaded}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
