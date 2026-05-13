'use client'

import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'

const CATEGORIES = [
  {
    name: 'Pokémon',
    description: 'Singles, graded slabs, sealed boxes.',
    href: '/products?game=pokemon',
    accent: '#EC1E79',
  },
  {
    name: 'One Piece',
    description: 'Leaders, alt arts, sealed product.',
    href: '/products?game=one-piece',
    accent: '#FF4DA6',
  },
  {
    name: 'Graded',
    description: 'PSA, CGC & ACE — investment grade.',
    href: '/products?category=graded',
    accent: '#EC1E79',
  },
  {
    name: 'Sealed',
    description: 'Booster boxes, ETBs & packs.',
    href: '/products?category=booster',
    accent: '#FF4DA6',
  },
]

function CategoryCard({
  category,
  index,
  isLast,
}: {
  category: (typeof CATEGORIES)[number]
  index: number
  isLast: boolean
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="lc-cat-card"
      style={{
        flex: 1,
        padding: '2.75rem 2.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
        position: 'relative',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'transform 0.25s ease',
        borderRight: isLast ? 'none' : '1px solid #1f1f1f',
      }}
    >
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <span
          style={{
            fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
            fontWeight: 900,
            color: '#fff',
            letterSpacing: '-0.03em',
            lineHeight: 1,
            display: 'block',
          }}
        >
          {category.name}
        </span>
        <span
          style={{
            position: 'absolute',
            bottom: '-4px',
            left: 0,
            height: '3px',
            width: hovered ? '100%' : '0%',
            background: category.accent,
            borderRadius: '2px',
            transition: 'width 0.3s ease',
            display: 'block',
          }}
        />
      </div>

      <p
        style={{
          fontSize: '0.85rem',
          color: 'rgba(255,255,255,0.4)',
          margin: '0.5rem 0 0',
          fontWeight: 400,
          lineHeight: 1.5,
        }}
      >
        {category.description}
      </p>

      <Link
        href={category.href}
        style={{
          marginTop: '1rem',
          fontSize: '0.875rem',
          fontWeight: 700,
          color: category.accent,
          textDecoration: 'none',
          letterSpacing: '0.01em',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
        }}
      >
        Browse &rarr;
      </Link>
    </motion.div>
  )
}

export function CategoryShowcase() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section
      ref={ref}
      style={{
        background: '#0a0a0a',
        padding: '0 0 0',
      }}
    >
      <style>{`
        .lc-cat-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border: 1px solid #1f1f1f;
          border-radius: 12px;
          overflow: hidden;
        }
        @media (max-width: 900px) {
          .lc-cat-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .lc-cat-card:nth-child(2) { border-right: none !important; }
          .lc-cat-card:nth-child(1), .lc-cat-card:nth-child(2) { border-bottom: 1px solid #1f1f1f; }
        }
        @media (max-width: 560px) {
          .lc-cat-grid { grid-template-columns: 1fr !important; }
          .lc-cat-card { border-right: none !important; border-bottom: 1px solid #1f1f1f !important; padding: 2rem 1.5rem !important; }
          .lc-cat-card:last-child { border-bottom: none !important; }
        }
      `}</style>
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '0 1.5rem',
        }}
      >
        {isInView && (
          <div className="lc-cat-grid">
            {CATEGORIES.map((cat, i) => (
              <CategoryCard
                key={cat.name}
                category={cat}
                index={i}
                isLast={i === CATEGORIES.length - 1}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
