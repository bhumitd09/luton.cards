'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, useInView, useMotionValue, useMotionTemplate } from 'framer-motion'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import type { Product } from '@/lib/products'

const categories = [
  { value: 'all', label: 'All' },
  { value: 'single', label: 'Singles' },
  { value: 'graded', label: 'Graded' },
  { value: 'booster', label: 'Boosters' },
]

function ProductCard({ product, index }: { product: Product; index: number }) {
  const { addToCart, canAddMore } = useCart()
  const [added, setAdded] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const spotlightBg = useMotionTemplate`radial-gradient(180px circle at ${mouseX}px ${mouseY}px, rgba(236,30,121,0.08), transparent 80%)`

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left)
    mouseY.set(e.clientY - rect.top)
  }

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    addToCart(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1400)
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ y: -5, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
      style={{
        position: 'relative',
        background: '#fff',
        borderRadius: '14px',
        overflow: 'hidden',
        border: '1px solid #ebebeb',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Spotlight overlay */}
      <motion.div style={{ background: spotlightBg, position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ width: '100%', aspectRatio: '4/3', position: 'relative', zIndex: 1, background: '#f5f5f5', overflow: 'hidden' }}>
        {product.image && (
          <img
            src={product.image}
            alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '0.5rem' }}
          />
        )}
        {product.stock <= 2 && product.stock > 0 && (
          <span style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.65)', color: '#fff', padding: '0.2rem 0.55rem', borderRadius: '5px', fontSize: '0.6875rem', fontWeight: 700 }}>
            {product.stock} left
          </span>
        )}
        {product.stock === 0 && (
          <span style={{ position: 'absolute', top: '10px', right: '10px', background: '#ef4444', color: '#fff', padding: '0.2rem 0.55rem', borderRadius: '5px', fontSize: '0.6875rem', fontWeight: 700 }}>
            Sold Out
          </span>
        )}
        {product.grade && (
          <span style={{ position: 'absolute', top: '10px', left: '10px', background: '#000', color: '#EC1E79', padding: '0.2rem 0.55rem', borderRadius: '5px', fontSize: '0.6875rem', fontWeight: 700 }}>
            {product.grade}
          </span>
        )}
      </div>

      <div style={{ padding: '0.9rem', flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
        <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.3rem', textTransform: 'capitalize' }}>{product.category}</p>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#111', marginBottom: 'auto', lineHeight: 1.3, paddingBottom: '0.75rem' }}>
          {product.name}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid #f0f0f0' }}>
          <span style={{ fontSize: '1.1875rem', fontWeight: 900, color: '#EC1E79' }}>
            £{product.price.toLocaleString()}
          </span>
          <motion.button
            onClick={handleAdd}
            disabled={!canAddMore(product) || added}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              background: added
                ? '#c81c6b'
                : product.stock === 0 || !canAddMore(product)
                  ? '#e5e7eb'
                  : '#EC1E79',
              color: product.stock === 0 || !canAddMore(product) ? '#9ca3af' : '#000',
              border: 'none',
              cursor: !canAddMore(product) ? 'not-allowed' : 'pointer',
              padding: '0.5rem 0.875rem', borderRadius: '8px',
              fontSize: '0.8125rem', fontWeight: 700,
            }}
          >
            <ShoppingCart size={13} />
            {added
              ? 'Added'
              : product.stock === 0
                ? 'Sold Out'
                : !canAddMore(product)
                  ? 'Max in Cart'
                  : 'Add'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

export function FeaturedProducts() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })
  const [activeCategory, setActiveCategory] = useState('all')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/products?featured=true')
      .then(r => r.json())
      .then(data => { setProducts(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = activeCategory === 'all' ? products : products.filter(p => p.category === activeCategory)

  return (
    <section ref={ref} style={{ padding: '5rem 0', background: '#f9f9f9' }}>
      <style>{`
        @media (max-width: 768px) {
          .fp-section { padding: 2rem 0 !important; }
          .fp-filter-row { overflow-x: auto; flex-wrap: nowrap !important; -webkit-overflow-scrolling: touch; padding-bottom: 0.25rem; }
          .fp-filter-row::-webkit-scrollbar { display: none; }
          .fp-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)) !important; }
        }
      `}</style>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: '2.5rem' }}
        >
          <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 900, color: '#000', letterSpacing: '-0.03em', marginBottom: '1.5rem' }}>
            Current Stock
          </h2>
          <div className="fp-filter-row" style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                style={{
                  padding: '0.45rem 1.1rem',
                  borderRadius: '9999px',
                  border: '1px solid',
                  borderColor: activeCategory === cat.value ? '#000' : '#e0e0e0',
                  background: activeCategory === cat.value ? '#000' : '#fff',
                  color: activeCategory === cat.value ? '#fff' : '#6b7280',
                  fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </motion.div>

        {loading ? (
          <div className="fp-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '1.25rem' }}>
            {[...Array(6)].map((_, i) => <div key={i} style={{ borderRadius: '14px', background: '#ebebeb', height: '300px' }} />)}
          </div>
        ) : (
          <div className="fp-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '1.25rem' }}>
            {filtered.map((product, i) => <ProductCard key={product.id} product={product} index={i} />)}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.3 }}
          style={{ marginTop: '2.5rem' }}
        >
          <Link href="/products" style={{ textDecoration: 'none' }}>
            <motion.span
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#000', fontWeight: 700, fontSize: '0.9375rem', borderBottom: '2px solid #EC1E79', paddingBottom: '2px', cursor: 'pointer' }}
              whileHover={{ gap: '0.7rem' }}
              transition={{ duration: 0.15 }}
            >
              View all cards <span style={{ fontSize: '1rem' }}>→</span>
            </motion.span>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
