'use client'

import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { BorderBeam } from '@/components/magicui/border-beam'

type Category = {
  name: string
  description: string
  href: string
  badge: string
  variant: 'feature' | 'standard'
  glyph: string
}

const CATEGORIES: Category[] = [
  {
    name: 'Pokémon',
    description: 'Vintage holos, modern alt arts, ex, V, VMAX, sealed product.',
    href: '/products?game=pokemon',
    badge: 'Featured',
    variant: 'feature',
    glyph: '◐',
  },
  {
    name: 'One Piece',
    description: 'Leaders, alt arts, OP-01 through latest sets.',
    href: '/products?game=one-piece',
    badge: 'Featured',
    variant: 'feature',
    glyph: '☠',
  },
  {
    name: 'Graded',
    description: 'PSA · CGC · ACE — investment grade.',
    href: '/products?category=graded',
    badge: 'Investment',
    variant: 'standard',
    glyph: '◇',
  },
  {
    name: 'Sealed',
    description: 'Booster boxes, ETBs, special sets.',
    href: '/products?category=booster',
    badge: 'In stock',
    variant: 'standard',
    glyph: '◰',
  },
]

function CategoryCard({ category }: { category: Category }) {
  const [hovered, setHovered] = useState(false)
  const isFeature = category.variant === 'feature'

  return (
    <Link
      href={category.href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={[
        'group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br p-6 transition-transform duration-300 ease-out',
        isFeature
          ? 'from-[#150814] via-[#0d0a10] to-[#070708] md:col-span-2 md:row-span-1 md:p-7'
          : 'from-[#0d0a10] via-[#0a0a0a] to-[#070708]',
        'hover:-translate-y-1',
      ].join(' ')}
      style={{ minHeight: isFeature ? '180px' : '160px' }}
    >
      {/* hover glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(60% 80% at 80% 0%, rgba(236,30,121,0.18) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="m-0 text-[10px] font-bold uppercase tracking-[0.16em] text-[#EC1E79]">
            {category.badge}
          </p>
          <h3 className="m-0 mt-2 text-[clamp(1.6rem,2.5vw,2.2rem)] font-black tracking-[-0.03em] text-white">
            {category.name}
          </h3>
          <p className="m-0 mt-2 max-w-[300px] text-sm leading-snug text-white/45">
            {category.description}
          </p>
        </div>
        <span
          aria-hidden
          className="select-none text-[2.5rem] leading-none text-white/[0.08] transition-colors duration-300 group-hover:text-[#EC1E79]/40"
        >
          {category.glyph}
        </span>
      </div>

      <div className="relative z-10 mt-6 flex items-center gap-1.5 text-sm font-bold text-[#EC1E79]">
        <span>Browse</span>
        <ArrowUpRight
          size={15}
          className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        />
      </div>

      {hovered && (
        <BorderBeam
          size={260}
          duration={9}
          colorFrom="#EC1E79"
          colorTo="#FF80B8"
          borderWidth={1.5}
        />
      )}
    </Link>
  )
}

export function CategoryShowcase() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="bg-[#070708] py-16 sm:py-20">
      <div className="mx-auto max-w-[1180px] px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.45 }}
          className="mb-9 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end"
        >
          <div>
            <p className="m-0 text-[10px] font-bold uppercase tracking-[0.16em] text-[#EC1E79]">
              Shop by
            </p>
            <h2 className="m-0 mt-2 text-[clamp(1.75rem,3.5vw,2.5rem)] font-black tracking-[-0.03em] text-white">
              Pick your poison.
            </h2>
          </div>
          <Link
            href="/products"
            className="text-xs font-bold uppercase tracking-[0.14em] text-white/40 transition-colors hover:text-[#EC1E79]"
          >
            Browse everything →
          </Link>
        </motion.div>

        {isInView && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4"
          >
            {CATEGORIES.map(cat => (
              <CategoryCard key={cat.name} category={cat} />
            ))}
          </motion.div>
        )}
      </div>
    </section>
  )
}
