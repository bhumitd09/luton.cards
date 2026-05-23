'use client'

import { useEffect, useState } from 'react'
import { Marquee } from '@/components/magicui/marquee'

const DEFAULT_ITEMS = [
  'PSA Graded',
  'CGC Certified',
  'ACE Graded',
  'Pokémon TCG',
  'One Piece TCG',
  'Booster Boxes',
  'Sealed Product',
  'Same Day Dispatch',
  'Free UK Shipping',
  'Luton, UK',
]

function Diamond() {
  return (
    <span
      aria-hidden
      className="inline-block size-1 rotate-45 bg-white/40"
    />
  )
}

export function MarqueeStrip() {
  const [items, setItems] = useState<string[]>(DEFAULT_ITEMS)

  useEffect(() => {
    fetch('/api/content?keys=marquee_items')
      .then(r => (r.ok ? r.json() : null))
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
    <div className="relative overflow-hidden bg-[#EC1E79] py-2.5">
      {/* edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#EC1E79] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#EC1E79] to-transparent" />

      <Marquee className="[--duration:38s] [--gap:1.75rem]" pauseOnHover repeat={3}>
        {items.map((item, i) => (
          <span key={i} className="flex shrink-0 items-center gap-7">
            <span className="whitespace-nowrap text-[11px] font-extrabold uppercase tracking-[0.14em] text-white">
              {item}
            </span>
            <Diamond />
          </span>
        ))}
      </Marquee>
    </div>
  )
}
