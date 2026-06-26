'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Search, Star, Tag, X, SlidersHorizontal as FilterIcon } from 'lucide-react'
import { formatGrade } from '@/lib/utils'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { useCart } from '@/lib/cart-context'
import type { Product } from '@/lib/products'
import { GAMES, GAME_LABELS, isGame } from '@/lib/games'
import { conditionShort, conditionLabel, conditionColor } from '@/lib/conditions'

const categories = [
  { value: 'all', label: 'All' },
  { value: 'single', label: 'Singles' },
  { value: 'graded', label: 'Graded' },
  { value: 'booster', label: 'Boosters' },
  { value: 'sealed', label: 'Sealed' },
]

const games = [
  { value: 'all', label: 'All Games' },
  ...GAMES.map(g => ({ value: g, label: GAME_LABELS[g] })),
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
              <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', aspectRatio: '4/3', objectFit: 'contain', padding: '0.5rem' }} />
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
            {!product.grade && product.condition ? (
              <span style={{
                position: 'absolute', top: '10px', right: '10px',
                background: conditionColor(product.condition), color: '#fff',
                padding: '0.2rem 0.6rem', borderRadius: '6px',
                fontSize: '0.6875rem', fontWeight: 700,
              }}>
                {conditionShort(product.condition)}
              </span>
            ) : product.stock <= 2 && !product.grade ? (
              <span style={{
                position: 'absolute', top: '10px', right: '10px',
                background: product.stock === 0 ? '#ef4444' : '#f59e0b',
                color: '#fff', padding: '0.2rem 0.6rem', borderRadius: '6px',
                fontSize: '0.6875rem', fontWeight: 700,
              }}>
                {product.stock === 0 ? 'Sold Out' : `${product.stock} left`}
              </span>
            ) : null}
          </div>
        </div>
      </Link>

      <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
          <Tag size={11} color="#9ca3af" />
          <span style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'capitalize' }}>{product.category}</span>
          {formatGrade(product.grade, product.grader) ? (
            <span style={{
              background: '#fef3c7', color: '#92400e',
              padding: '0.1rem 0.45rem', borderRadius: '4px',
              fontSize: '0.6875rem', fontWeight: 700, marginLeft: 'auto',
            }}>
              {formatGrade(product.grade, product.grader)}
            </span>
          ) : product.condition ? (
            <span style={{
              background: `${conditionColor(product.condition)}1a`,
              color: conditionColor(product.condition),
              padding: '0.1rem 0.45rem', borderRadius: '4px',
              fontSize: '0.6875rem', fontWeight: 700, marginLeft: 'auto',
            }}>
              {conditionLabel(product.condition)}
            </span>
          ) : null}
        </div>

        <Link href={`/products/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111', marginBottom: '0.35rem', lineHeight: 1.3 }}>
            {product.name}
          </h3>
        </Link>
        {/* Description intentionally not shown on the card — keeps every card the
            same height. Full details live on the product page. */}
        {/* Price + a FULL-WIDTH action button below it, so a long price
            (e.g. £2,000) can never squash or wrap the button — every card's
            button is identical and lines up across the grid. */}
        <div style={{ marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#EC1E79', letterSpacing: '-0.01em' }}>
              £{product.price.toLocaleString()}
            </span>
            {product.stock > 0 && product.stock <= 5 && (
              <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700, whiteSpace: 'nowrap' }}>
                {Math.max(0, product.stock - cartQuantity(product.id))} left
              </span>
            )}
          </div>
          <motion.button
            onClick={handleAdd}
            disabled={!canAddMore(product) || added}
            whileHover={canAddMore(product) && !added ? { scale: 1.02 } : undefined}
            whileTap={canAddMore(product) && !added ? { scale: 0.98 } : undefined}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem',
              background: added
                ? '#c81c6b'
                : product.stock === 0 || !canAddMore(product)
                  ? '#e5e7eb'
                  : '#EC1E79',
              color: product.stock === 0 || !canAddMore(product) ? '#9ca3af' : '#000',
              border: 'none',
              cursor: !canAddMore(product) ? 'not-allowed' : 'pointer',
              padding: '0.7rem 1rem', borderRadius: '11px',
              fontSize: '0.8125rem', fontWeight: 800,
              transition: 'background 0.2s ease',
            }}
          >
            <ShoppingCart size={15} />
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
  const [filtersOpen, setFiltersOpen] = useState(false) // mobile drawer

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

  // Shared predicates so the sidebar counts and the grid stay in lockstep.
  const matchesSearch = (p: Product) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.description || '').toLowerCase().includes(search.toLowerCase())
  const inGame = (p: Product) => game === 'all' || (p.game || 'pokemon') === game
  const inCategory = (p: Product) => category === 'all' || p.category === category

  // Live counts: a card-type count respects the current game + search (but not
  // the type itself), and vice-versa, so the numbers reflect what a click yields.
  const categoryCount = (value: string) =>
    products.filter(p => matchesSearch(p) && inGame(p) && (value === 'all' || p.category === value)).length
  const gameCount = (value: string) =>
    products.filter(p => matchesSearch(p) && inCategory(p) && (value === 'all' || (p.game || 'pokemon') === value)).length

  const filtered = products
    .filter(inCategory)
    .filter(inGame)
    .filter(matchesSearch)
    .sort((a, b) => {
      if (sort === 'price-asc') return a.price - b.price
      if (sort === 'price-desc') return b.price - a.price
      if (sort === 'name') return a.name.localeCompare(b.name)
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0)
    })

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      <style>{`
        .lc-search {
          width: 100%; box-sizing: border-box;
          padding: 0.6rem 2.25rem 0.6rem 2.1rem;
          background: #fafafa; border: 1px solid #e5e7eb; border-radius: 10px;
          font-size: 0.9rem; color: #111; outline: none; font-family: inherit;
          transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
        }
        .lc-search::placeholder { color: #9ca3af; }
        .lc-search:focus { background: #fff; border-color: rgba(236,30,121,0.45); box-shadow: 0 0 0 3px rgba(236,30,121,0.12); }
        .lc-sort {
          appearance: none; -webkit-appearance: none; width: 100%; box-sizing: border-box;
          padding: 0.55rem 2rem 0.55rem 0.85rem;
          background: #fafafa url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b7280'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z' clip-rule='evenodd'/%3E%3C/svg%3E") no-repeat right 0.6rem center / 14px;
          border: 1px solid #e5e7eb; border-radius: 10px; font-size: 0.85rem;
          color: #374151; font-weight: 600; cursor: pointer; outline: none; font-family: inherit;
        }
        .lc-sort:focus { border-color: rgba(236,30,121,0.45); box-shadow: 0 0 0 3px rgba(236,30,121,0.12); }
        /* Sidebar filter rows */
        .lc-frow {
          display: flex; align-items: center; justify-content: space-between;
          width: 100%; box-sizing: border-box; text-align: left;
          padding: 0.5rem 0.65rem; border-radius: 9px; border: 1px solid transparent;
          background: transparent; color: #374151; font-size: 0.875rem; font-weight: 600;
          cursor: pointer; font-family: inherit; transition: background 0.12s, color 0.12s;
        }
        .lc-frow:hover { background: #f4f4f5; color: #111; }
        .lc-frow .lc-count { font-size: 0.75rem; font-weight: 600; color: #9ca3af; }
        .lc-frow.is-type-active { background: #fdecf4; border-color: #f7c6dc; color: #EC1E79; font-weight: 800; }
        .lc-frow.is-type-active .lc-count { color: #EC1E79; }
        .lc-frow.is-game-active { background: #EC1E79; color: #fff; font-weight: 800; }
        .lc-frow.is-game-active .lc-count { color: rgba(255,255,255,0.85); }
        .lc-fhead { font-size: 0.6875rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #9ca3af; margin: 0 0 0.5rem 0.15rem; }
        .products-filter-toggle { display: none; }
        .products-sidebar-overlay { display: none; }
        @media (max-width: 900px) {
          .products-layout { display: block !important; }
          .products-filter-toggle {
            display: inline-flex; align-items: center; gap: 0.5rem;
            padding: 0.6rem 1.1rem; border-radius: 11px; border: 1px solid #e5e7eb;
            background: #fff; color: #111; font-weight: 800; font-size: 0.875rem;
            cursor: pointer; margin-bottom: 1.25rem;
          }
          .products-sidebar {
            position: fixed !important; top: 0 !important; left: 0 !important; bottom: 0 !important;
            width: 290px !important; max-width: 85vw; z-index: 120 !important;
            transform: translateX(-105%); transition: transform 0.28s ease;
            overflow-y: auto; border-radius: 0 !important; height: 100vh !important;
            box-shadow: 0 20px 60px -10px rgba(0,0,0,0.4);
          }
          .products-sidebar.open { transform: translateX(0); }
          .products-sidebar-overlay.open { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 110; }
          .products-sidebar-close { display: flex !important; }
        }
        @media (min-width: 901px) { .products-sidebar-close { display: none !important; } }
        .products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 1.25rem; }
        @media (max-width: 520px) { .products-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 0.85rem !important; } }
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
                {isGame(game) ? `${GAME_LABELS[game]} Cards` : 'Shop All Cards'}
              </h1>
            </motion.div>
          </div>
        </div>

        {/* Shop: a filter sidebar (search + card type + game + sort) beside the
            results grid. On mobile the sidebar becomes a slide-in drawer behind
            a "Filters" button. */}
        <div className="container" style={{ padding: '2rem 1.5rem 3.5rem' }}>
          <button className="products-filter-toggle" onClick={() => setFiltersOpen(true)}>
            <FilterIcon size={16} /> Filters
          </button>

          <div className="products-layout" style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>

            {/* Filter sidebar */}
            <aside
              className={`products-sidebar${filtersOpen ? ' open' : ''}`}
              style={{
                flex: '0 0 220px', background: '#fff', border: '1px solid #ececef',
                borderRadius: '16px', padding: '1.1rem', position: 'sticky', top: '90px',
              }}
            >
              <button
                className="products-sidebar-close"
                onClick={() => setFiltersOpen(false)}
                aria-label="Close filters"
                style={{
                  display: 'none', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                  marginBottom: '1rem', background: 'none', border: 'none', cursor: 'pointer',
                  color: '#111', fontWeight: 800, fontSize: '1rem', padding: 0,
                }}
              >
                Filters <X size={18} />
              </button>

              {/* Search */}
              <div style={{ position: 'relative', marginBottom: '1.4rem' }}>
                <Search size={15} color="#9ca3af" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
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

              {/* Card type */}
              <div style={{ marginBottom: '1.4rem' }}>
                <p className="lc-fhead">Card type</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {categories.map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => { setCategory(cat.value); setFiltersOpen(false) }}
                      className={`lc-frow${category === cat.value ? ' is-type-active' : ''}`}
                    >
                      <span>{cat.label}</span>
                      <span className="lc-count">{categoryCount(cat.value)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Game */}
              <div style={{ marginBottom: '1.4rem' }}>
                <p className="lc-fhead">Game</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {games.map(g => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => { setGame(g.value); setFiltersOpen(false) }}
                      className={`lc-frow${game === g.value ? ' is-game-active' : ''}`}
                    >
                      <span>{g.label}</span>
                      <span className="lc-count">{gameCount(g.value)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div>
                <p className="lc-fhead">Sort by</p>
                <select value={sort} onChange={e => setSort(e.target.value)} className="lc-sort" aria-label="Sort cards">
                  {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </aside>

            {/* Mobile drawer backdrop */}
            <div
              className={`products-sidebar-overlay${filtersOpen ? ' open' : ''}`}
              onClick={() => setFiltersOpen(false)}
            />

            {/* Results */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                {loading ? 'Loading…' : `${filtered.length} card${filtered.length !== 1 ? 's' : ''} found`}
              </p>

              {loading ? (
                <div className="products-grid">
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
                  <motion.div layout className="products-grid">
                    {filtered.map((product, i) => (
                      <ProductCard key={product.id} product={product} index={i} />
                    ))}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </div>
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
