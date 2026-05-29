'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Boxes, Search, Package } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface InventoryProduct {
  id: string
  name: string
  category: string
  stock: number
  price: number
  active: boolean
  images: string[]
}

type StockFilter = 'all' | 'low' | 'out'

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  graded: { bg: 'rgba(129,140,248,0.15)', color: '#818cf8', label: 'Graded' },
  single: { bg: 'rgba(236,30,121,0.12)', color: '#EC1E79', label: 'Single' },
  booster: { bg: 'rgba(245,158,11,0.13)', color: '#f59e0b', label: 'Booster' },
  sealed: { bg: 'rgba(52,211,153,0.12)', color: '#34d399', label: 'Sealed' },
}

function getCategoryStyle(category: string) {
  return CATEGORY_COLORS[category] ?? { bg: 'rgba(107,114,128,0.15)', color: '#6b7280', label: category }
}

function getStockColor(stock: number): string {
  if (stock === 0) return '#ef4444'
  if (stock <= 5) return '#f59e0b'
  return '#10b981'
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const [products, setProducts] = useState<InventoryProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [pendingEdits, setPendingEdits] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState<StockFilter>('all')
  const [search, setSearch] = useState('')
  const [successBanner, setSuccessBanner] = useState(false)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/inventory')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setProducts(data.products ?? [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchesFilter =
      filter === 'all' ? true :
      filter === 'low' ? p.stock > 0 && p.stock <= 5 :
      p.stock === 0
    return matchesSearch && matchesFilter
  })

  const outOfStock = products.filter(p => p.stock === 0).length
  const inStock = products.filter(p => p.stock > 0).length

  const handleEditStockChange = (id: string, value: number) => {
    setPendingEdits(prev => ({ ...prev, [id]: value }))
  }

  const handleQuickUpdate = async (id: string, delta: number) => {
    const current = products.find(p => p.id === id)
    if (!current) return
    const newStock = Math.max(0, current.stock + delta)

    // Optimistic update
    setProducts(prev =>
      prev.map(p => p.id === id ? { ...p, stock: newStock } : p)
    )

    try {
      await fetch('/api/admin/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: [{ id, stock: newStock }] }),
      })
    } catch {
      // Revert on failure
      fetchProducts()
    }
  }

  const handleSave = async () => {
    const updates = Object.entries(pendingEdits).map(([id, stock]) => ({ id, stock }))
    if (updates.length === 0) {
      setEditMode(false)
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      })
      if (!res.ok) throw new Error('Save failed')
      await fetchProducts()
      setPendingEdits({})
      setEditMode(false)
      setSuccessBanner(true)
      setTimeout(() => setSuccessBanner(false), 2000)
    } catch {
      // silent
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setPendingEdits({})
    setEditMode(false)
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Success banner */}
      <AnimatePresence>
        {successBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.25)',
              borderRadius: '11px',
              padding: '0.75rem 1.25rem',
              marginBottom: '1.25rem',
              color: '#10b981',
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            Stock levels updated successfully.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <Boxes size={12} color="#EC1E79" />
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#EC1E79', textTransform: 'uppercase', letterSpacing: '0.16em' }}>
              Inventory
            </span>
          </div>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.4rem, 2.5vw, 1.75rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.025em' }}>
            Inventory
          </h1>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: '#9ca3af' }}>Manage stock levels across your catalogue</p>
        </div>

        <div style={{ display: 'flex', gap: '0.625rem' }}>
          {!editMode ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setEditMode(true)}
              style={{
                padding: '0.625rem 1.25rem',
                background: '#161617',
                border: '1px solid #202022',
                borderRadius: '11px',
                color: '#e4e4e7',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Edit Stock
            </motion.button>
          ) : (
            <>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCancel}
                disabled={saving}
                style={{
                  padding: '0.625rem 1.25rem',
                  background: '#161617',
                  border: '1px solid #202022',
                  borderRadius: '11px',
                  color: '#9ca3af',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  opacity: saving ? 0.5 : 1,
                }}
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '0.625rem 1.25rem',
                  background: 'linear-gradient(135deg,#EC1E79,#FF4DA6)',
                  border: 'none',
                  borderRadius: '11px',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '0.875rem',
                  boxShadow: '0 8px 22px -10px rgba(236,30,121,0.6)',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </motion.button>
            </>
          )}
        </div>
      </div>

      {/* Out-of-stock alert banner */}
      {outOfStock > 0 && (
        <div style={{
          background: 'rgba(245,158,11,0.1)',
          border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: '11px',
          padding: '0.75rem 1.25rem',
          marginBottom: '1.5rem',
          color: '#f59e0b',
          fontWeight: 600,
          fontSize: '0.875rem',
        }}>
          {outOfStock} {outOfStock === 1 ? 'product is' : 'products are'} out of stock
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total SKUs', value: products.length, color: '#f4f4f5' },
          { label: 'In Stock', value: inStock, color: '#10b981' },
          { label: 'Out of Stock', value: outOfStock, color: '#ef4444' },
        ].map(stat => (
          <div
            key={stat.label}
            style={{
              background: '#0f0f10',
              border: '1px solid #202022',
              borderRadius: '16px',
              padding: '1.25rem 1.35rem',
            }}
          >
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
              {stat.label}
            </div>
            <div style={{ fontSize: '1.875rem', fontWeight: 900, color: stat.color, letterSpacing: '-0.02em' }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filter + Search bar */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Filter pills */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {([
            { key: 'all', label: 'All' },
            { key: 'low', label: 'Low Stock' },
            { key: 'out', label: 'Out of Stock' },
          ] as { key: StockFilter; label: string }[]).map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '999px',
                border: filter === f.key ? '1px solid rgba(236,30,121,0.25)' : '1px solid #202022',
                background: filter === f.key ? 'rgba(236,30,121,0.12)' : '#161617',
                color: filter === f.key ? '#EC1E79' : '#9ca3af',
                fontWeight: 700,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={15} color="#6b7280" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 0.8rem 0.6rem 2.25rem',
              background: '#0c0c0d',
              border: '1px solid #202022',
              borderRadius: '11px',
              color: '#fff',
              fontSize: '0.875rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Product list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                background: '#0f0f10',
                border: '1px solid #202022',
                borderRadius: '16px',
                padding: '1rem 1.25rem',
                height: '72px',
                opacity: 0.5,
              }}
            />
          ))
        ) : filteredProducts.length === 0 ? (
          <div style={{
            background: '#0f0f10',
            border: '1px solid #202022',
            borderRadius: '16px',
            padding: '3rem 1.5rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '999px',
              background: '#161617',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Package size={20} color="#6b7280" />
            </div>
            <p style={{ color: '#f4f4f5', margin: 0, fontWeight: 700 }}>No products found</p>
            <p style={{ color: '#9ca3af', margin: 0, fontSize: '0.875rem' }}>Try adjusting your search or filters.</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {filteredProducts.map((product, index) => {
              const catStyle = getCategoryStyle(product.category)
              const currentStock = pendingEdits[product.id] !== undefined ? pendingEdits[product.id] : product.stock
              const imageUrl = product.images?.[0]

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: index * 0.03 }}
                  style={{
                    background: '#0f0f10',
                    border: '1px solid #202022',
                    borderRadius: '16px',
                    padding: '0.875rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    transition: 'background 0.15s ease',
                    cursor: 'default',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#161617' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#0f0f10' }}
                >
                  {/* Thumbnail */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '11px',
                    background: '#161617',
                    flexShrink: 0,
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #202022',
                  }}>
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={product.name}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <Package size={18} color="#EC1E79" />
                    )}
                  </div>

                  {/* Name + category */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: '#f4f4f5', fontSize: '0.9375rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {product.name}
                    </div>
                    <div style={{ marginTop: '0.25rem' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.15rem 0.6rem',
                        borderRadius: '999px',
                        background: catStyle.bg,
                        color: catStyle.color,
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        textTransform: 'capitalize',
                      }}>
                        {catStyle.label}
                      </span>
                    </div>
                  </div>

                  {/* Stock display or edit input */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}>
                    {/* Low / out-of-stock pill */}
                    {!editMode && product.stock === 0 && (
                      <span style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '999px',
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.25)',
                        color: '#ef4444',
                        fontSize: '0.625rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        whiteSpace: 'nowrap',
                      }}>
                        Out
                      </span>
                    )}
                    {!editMode && product.stock > 0 && product.stock <= 5 && (
                      <span style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '999px',
                        background: 'rgba(245,158,11,0.1)',
                        border: '1px solid rgba(245,158,11,0.25)',
                        color: '#f59e0b',
                        fontSize: '0.625rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        whiteSpace: 'nowrap',
                      }}>
                        Low
                      </span>
                    )}
                    {editMode ? (
                      <input
                        type="number"
                        min="0"
                        value={currentStock}
                        onChange={e => handleEditStockChange(product.id, Math.max(0, parseInt(e.target.value, 10) || 0))}
                        style={{
                          background: '#0c0c0d',
                          border: '1px solid #202022',
                          color: '#fff',
                          padding: '0.6rem 0.6rem',
                          borderRadius: '11px',
                          width: '80px',
                          textAlign: 'center',
                          fontSize: '0.9375rem',
                          fontWeight: 700,
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    ) : (
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '1.125rem', fontWeight: 800, color: getStockColor(product.stock) }}>
                          {product.stock}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#6b7280', marginLeft: '0.25rem' }}>units</span>
                      </div>
                    )}
                  </div>

                  {/* Quick action buttons (non-edit mode only) */}
                  {!editMode && (
                    <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
                      <motion.button
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => handleQuickUpdate(product.id, -1)}
                        disabled={product.stock === 0}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '11px',
                          background: 'rgba(239,68,68,0.1)',
                          border: '1px solid rgba(239,68,68,0.25)',
                          color: '#ef4444',
                          fontWeight: 800,
                          fontSize: '0.875rem',
                          cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: product.stock === 0 ? 0.4 : 1,
                          lineHeight: 1,
                        }}
                      >
                        -1
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => handleQuickUpdate(product.id, 1)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '11px',
                          background: 'rgba(236,30,121,0.12)',
                          border: '1px solid rgba(236,30,121,0.25)',
                          color: '#EC1E79',
                          fontWeight: 800,
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          lineHeight: 1,
                        }}
                      >
                        +1
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
