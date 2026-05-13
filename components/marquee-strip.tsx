'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const DEFAULT_ITEMS = [
  'PSA Graded', 'Rare Singles', 'CGC Certified',
  'Same Day Dispatch', 'Graded Slabs', 'ACE Graded',
  'Booster Boxes', 'Sealed Product', 'Free UK Shipping',
]

function Diamond() {
  return (
    <motion.span
      animate={{ opacity: [0.5, 1, 0.5], scale: [0.85, 1.1, 0.85] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', repeatType: 'loop' }}
      style={{
        display: 'inline-block',
        margin: '0 0.9rem',
        color: 'rgba(255,255,255,0.6)',
        fontSize: '0.45rem',
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      ◆
    </motion.span>
  )
}

function Row({ items, direction = 1, duration = 45 }: { items: string[]; direction?: 1 | -1; duration?: number }) {
  // Double items so the loop is seamless
  const doubled = [...items, ...items]
  return (
    <div style={{ overflow: 'hidden' }}>
      <motion.div
        style={{ display: 'flex', alignItems: 'center', width: 'max-content' }}
        animate={{ x: direction === 1 ? ['0%', '-50%'] : ['-50%', '0%'] }}
        transition={{ duration, repeat: Infinity, ease: 'linear' }}
      >
        {doubled.map((item, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
            <span style={{
              fontSize: '0.6875rem',
              fontWeight: item.includes('·') ? 500 : 800,
              color: item.includes('·') ? 'rgba(255,255,255,0.85)' : '#fff',
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}>
              {item}
            </span>
            <Diamond />
          </span>
        ))}
      </motion.div>
    </div>
  )
}

export function MarqueeStrip() {
  const [items, setItems] = useState<string[]>(DEFAULT_ITEMS)

  useEffect(() => {
    fetch('/api/content?keys=marquee_items')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.marquee_items) {
          try {
            const parsed = JSON.parse(data.marquee_items)
            if (Array.isArray(parsed) && parsed.length > 0) setItems(parsed)
          } catch {
            // keep defaults
          }
        }
      })
      .catch(() => {})
  }, [])

  return (
    <div style={{
      background: '#EC1E79',
      padding: '0.55rem 0',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '60px', background: 'linear-gradient(to right, #EC1E79, transparent)', zIndex: 2, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '60px', background: 'linear-gradient(to left, #EC1E79, transparent)', zIndex: 2, pointerEvents: 'none' }} />
      <Row items={items} direction={1} duration={45} />
    </div>
  )
}
