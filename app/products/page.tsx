'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Search, SlidersHorizontal, Star, Tag, X } from 'lucide-react'
import { formatGrade } from '@/lib/utils'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { useCart } from '@/lib/cart-context'
import type { Product } from '@/lib/products'

const categories = [
  { value: 'all', label: 'All' },
  { value: 'single', label: 'Singles' },
  { value: 'graded', label: 'Graded' },
  { value: 'booster', label: 'Boosters' },
  { value: 'sealed', label: 'Sealed' },
]

const games = [
  { value: 'all', label: 'All Games' },
  { value: 'pokemon', label: 'Pokémon' },
  { value: 'one-piece', label: 'One Piece' },
]

const sortOptions = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low → High' },
  { value: 'price-desc', label: 'Price: High → Low' },
  { value: 'name', label: 'Name A–Z' },
]

function ProductCard({ product, index }: { product: Product; index: number }) {
  const { addToCart, canAddMore, cartQuantity } = useCart()
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    addToCart(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.04, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -6, transition: { type: 'spring', stiffness: 300, damping: 18 } }}
      style={{
        background: '#fff',
        borderRadius: '18px',
        overflow: 'hidden',
        border: '1.5px solid #f0f0f0',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Badges */}
      <Link href={`/products/${product.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
        <div style={{ position: 'relative' }}>
          <div
            style={{
              width: '100%', aspectRatio: '4/3',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', background: '#f5f5f5',
              overflow: 'hidden',
            }}
          >
            {product.image && (
              <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '0.5rem' }} />
            )}
            <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{
                background: 'rgba(0,0,0,0.7)', color: '#fff',
                padding: '0.2rem 0.6rem', borderRadius: '6px',
                fontSize: '0.6875rem', fontWeight: 700, textTransform: 'capitalize',
              }}>
                {product.category}
              </span>
            </div>
            {formatGrade(product.grade, product.grader) && (
              <span style={{
                position: 'absolute', top: '10px', right: '10px',
                background: '#000', color: '#EC1E79',
                padding: '0.2rem 0.6rem', borderRadius: '6px',
                fontSize: '0.6875rem', fontWeight: 700,
              }}>
                {formatGrade(product.grade, product.grader)}
              </span>
            )}
            {product.stock <= 2 && !product.grade && (
              <span style={{
                position: 'absolute', top: '10px', right: '10px',
                background: product.stock === 0 ? '#ef4444' : '#f59e0b',
                color: '#fff', padding: '0.2rem 0.6rem', borderRadius: '6px',
                fontSize: '0.6875rem', fontWeight: 700,
              }}>
                {product.stock === 0 ? 'Sold Out' : `${product.stock} left`}
              </span>
            )}
          </div>
        </div>
      </Link>

      <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
          <Tag size={11} color="#9ca3af" />
          <span style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'capitalize' }}>{product.category}</span>
          {formatGrade(product.grade, product.grader) && (
            <span style={{
              background: '#fef3c7', color: '#92400e',
              padding: '0.1rem 0.45rem', borderRadius: '4px',
              fontSize: '0.6875rem', fontWeight: 700, marginLeft: 'auto',
            }}>
              {formatGrade(product.grade, product.grader)}
            </span>
          )}
        </div>

        <Link href={`/products/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111', marginBottom: '0.35rem', lineHeight: 1.3 }}>
            {product.name}
          </h3>
        </Link>
        {product.description && (
          <p style={{ fontSize: '0.8125rem', color: '#6b7280', lineHeight: 1.5, marginBottom: '0.75rem', flex: 1 }}>
            {product.description.slice(0, 80)}…
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#EC1E79' }}>
              £{product.price.toLocaleString()}
            </span>
            {product.stock > 0 && product.stock <= 5 && (
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600 }}>
                {product.stock - cartQuantity(product.id)} left
              </span>
            )}
          </div>
          <motion.button
            onClick={handleAdd}
            disabled={!canAddMore(product) || added}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              background: added
                ? '#c81c6b'
                : product.stock === 0 || !canAddMore(product)
                  ? '#e5e7eb'
                  : '#EC1E79',
              color: product.stock === 0 || !canAddMore(product) ? '#9ca3af' : '#000',
              border: 'none',
              cursor: !canAddMore(product) ? 'not-allowed' : 'pointer',
              padding: '0.55rem 1rem', borderRadius: '10px',
              fontSize: '0.8125rem', fontWeight: 700,
              transition: 'background 0.2s ease',
            }}
          >
            <ShoppingCart size={14} />
            {added
              ? 'Added!'
              : product.stock === 0
                ? 'Sold Out'
                : !canAddMore(product)
                  ? 'Max in Cart'
                  : 'Add to Cart'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

function ProductsContent() {
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get('category') || 'all'
  const initialGame = searchParams.get('game') || 'all'

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState(initialCategory)
  const [game, setGame] = useState(initialGame)
  const [sort, setSort] = useState('featured')

  // Update from URL params on nav
  useEffect(() => {
    setCategory(searchParams.get('category') || 'all')
    setGame(searchParams.get('game') || 'all')
  }, [searchParams])

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(data => { setProducts(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = products
    .filter(p => category === 'all' || p.category === category)
    .filter(p => game === 'all' || (p.game || 'pokemon') === game)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.description || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'price-asc') return a.price - b.price
      if (sort === 'price-desc') return b.price - a.price
      if (sort === 'name') return a.name.localeCompare(b.name)
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0)
    })

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      <style>{`
        @media (max-width: 768px) {
          .products-header { padding: 2.5rem 0 2rem !important; }
          .products-filter-bar { flex-direction: column !important; align-items: stretch !important; }
          .products-pill-row { overflow-x: auto !important; flex-wrap: nowrap !important; -webkit-overflow-scrolling: touch; padding-bottom: 0.25rem; }
          .products-pill-row::-webkit-scrollbar { display: none; }
          .products-sort { margin-left: 0 !important; width: 100%; }
          .products-sort select { width: 100% !important; }
          .products-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)) !important; }
          /* Drop sticky on mobile — the filter bar stacks into a tall column
             and the 73px desktop offset doesn't match the real mobile header
             height. Static lets it scroll naturally with the page. */
          .products-filter-wrap { position: static !important; padding: 0.75rem 0 !important; }
        }
      `}</style>
      <Header />
      <main>
        {/* Page Header */}
        <div className="products-header" style={{
          background: 'linear-gradient(135deg, #000 0%, #111 50%, #0d1a17 100%)',
          padding: '4rem 0 3rem', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'radial-gradient(ellipse at 50% 0%, rgba(236,30,121,0.12) 0%, transparent 60%)',
            pointerEvents: 'none',
          }} />
          <div className="container" style={{ position: 'relative' }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                background: 'rgba(236,30,121,0.1)', color: '#EC1E79',
                border: '1px solid rgba(236,30,121,0.25)',
                padding: '0.35rem 0.9rem', borderRadius: '9999px',
                fontSize: '0.8125rem', fontWeight: 700, marginBottom: '1rem',
              }}>
                <Star size={12} fill="#EC1E79" />
                Full Collection
              </div>
              <h1 style={{
                fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900,
                color: '#fff', letterSpacing: '-0.025em',
              }}>
                {game === 'pokemon' ? 'Pokémon Cards' : game === 'one-piece' ? 'One Piece TCG' : 'Shop All Cards'}
              </h1>
            </motion.div>
          </div>
        </div>

        {/* Filters
            Hierarchy:
            - Primary filter (Game)     → solid pink-gradient pill when active
            - Secondary filter (Category) → soft pink-tinted pill when active
            - Tertiary (Sort)           → minimal styled select
            One colour system across the row instead of pink-vs-black. */}
        <div className="products-filter-wrap" style={{
          background: '#fff', borderBottom: '1px solid #ececef',
          position: 'sticky', top: '73px', zIndex: 50, padding: '0.85rem 0',
        }}>
          <style>{`
            .lc-pill {
              padding: 0.45rem 0.95rem;
              border-radius: 9999px;
              border: 1px solid #ececef;
              background: #f7f7f8;
              color: #4b5563;
              font-weight: 600;
              font-size: 0.825rem;
              line-height: 1;
              cursor: pointer;
              letter-spacing: -0.005em;
              transition: background 0.15s, color 0.15s, border-color 0.15s, box-shadow 0.15s, transform 0.15s;
            }
            .lc-pill:hover { background: #eef0f3; color: #111; }
            .lc-pill.is-primary-active {
              background: linear-gradient(135deg, #EC1E79 0%, #FF4DA6 100%);
              border-color: transparent;
              color: #fff;
              box-shadow: 0 6px 18px -8px rgba(236,30,121,0.55);
            }
            .lc-pill.is-secondary-active {
              background: rgba(236,30,121,0.1);
              border-color: rgba(236,30,121,0.25);
              color: #EC1E79;
              font-weight: 700;
            }
            .lc-search {
              width: 100%;
              padding: 0.6rem 2.25rem 0.6rem 2.25rem;
              background: #f5f5f7;
              border: 1px solid transparent;
              border-radius: 10px;
              font-size: 0.9rem;
              color: #111;
              outline: none;
              transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
              font-family: inherit;
            }
            .lc-search::placeholder { color: #9ca3af; }
            .lc-search:focus {
              background: #fff;
              border-color: rgba(236,30,121,0.45);
              box-shadow: 0 0 0 3px rgba(236,30,121,0.12);
            }
            .lc-sort {
              appearance: none;
              -webkit-appearance: none;
              padding: 0.5rem 2rem 0.5rem 0.85rem;
              background: #f7f7f8 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b7280'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z' clip-rule='evenodd'/%3E%3C/svg%3E") no-repeat right 0.55rem center / 14px;
              border: 1px solid #ececef;
              border-radius: 10px;
              font-size: 0.85rem;
              color: #374151;
              font-weight: 600;
              cursor: pointer;
              outline: none;
              font-family: inherit;
            }
            .lc-sort:focus { border-color: rgba(236,30,121,0.45); box-shadow: 0 0 0 3px rgba(236,30,121,0.12); }
            .lc-filter-divider {
              width: 1px;
              align-self: stretch;
              background: #ececef;
              flex-shrink: 0;
            }
            @media (max-width: 768px) {
              .lc-filter-divider { display: none; }
            }
          `}</style>

          <div className="container products-filter-bar" style={{
            display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center',
          }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: '1 1 260px', minWidth: '220px', maxWidth: '420px' }}>
              <Search size={15} color="#9ca3af" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search cards..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="lc-search"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  style={{
                    position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                    background: '#ececef', border: 'none', cursor: 'pointer',
                    color: '#6b7280', borderRadius: 999, width: 22, height: 22,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="lc-filter-divider" />

            {/* Game pills — PRIMARY filter */}
            <div className="products-pill-row" style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {games.map(g => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setGame(g.value)}
                  className={`lc-pill ${game === g.value ? 'is-primary-active' : ''}`}
                >
                  {g.label}
                </button>
              ))}
            </div>

            <div className="lc-filter-divider" />

            {/* Category pills — SECONDARY filter */}
            <div className="products-pill-row" style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {categories.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`lc-pill ${category === cat.value ? 'is-secondary-active' : ''}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="products-sort" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
              <SlidersHorizontal size={14} color="#9ca3af" />
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                className="lc-sort"
                aria-label="Sort cards"
              >
                {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="container" style={{ padding: '2.5rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
              {loading ? 'Loading...' : `${filtered.length} card${filtered.length !== 1 ? 's' : ''} found`}
            </p>
          </div>

          {loading ? (
            <div className="products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
              {[...Array(8)].map((_, i) => (
                <div key={i} style={{ borderRadius: '18px', background: '#f0f0f0', height: '340px' }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem 0', color: '#9ca3af' }}>
              <p style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>No cards found</p>
              <p>Try adjusting your search or filters</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <motion.div
                layout
                className="products-grid"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}
              >
                {filtered.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #EC1E79', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      </div>
    }>
      <ProductsContent />
    </Suspense>
  )
}
