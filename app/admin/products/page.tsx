'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Pencil, Trash2, Search, X, Check, AlertTriangle,
  Package, Star, ChevronLeft, ChevronRight, ToggleLeft, ToggleRight,
  Image as ImageIcon, Tag, Copy,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  comparePrice: number | null
  stock: number
  category: string
  game?: string
  images: string[]
  grade: string | null
  grader: string | null
  featured: boolean
  active: boolean
  tags: string[]
  createdAt: string
  updatedAt: string
}

type CategoryFilter = 'all' | 'single' | 'graded' | 'booster' | 'sealed'
type GameFilter = 'all' | 'pokemon' | 'one-piece'
type StockFilter = 'all' | 'in' | 'low' | 'out'

const CATEGORY_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  graded: { bg: 'rgba(129,140,248,0.15)', color: '#818cf8', label: 'Graded' },
  single: { bg: 'rgba(236,30,121,0.12)', color: '#EC1E79', label: 'Single' },
  booster: { bg: 'rgba(245,158,11,0.13)', color: '#f59e0b', label: 'Booster' },
  sealed: { bg: 'rgba(52,211,153,0.12)', color: '#34d399', label: 'Sealed' },
}

const EMPTY_FORM = {
  name: '',
  category: 'single',
  price: '',
  comparePrice: '',
  stock: '',
  grade: '',
  grader: 'PSA',
  description: '',
  tags: '',
  featured: false,
  active: true,
  images: [] as string[],
}

type FormData = typeof EMPTY_FORM

// ─── Shared Styles ───────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.65rem 0.875rem',
  background: '#161616',
  border: '1px solid #1f1f1f',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '0.875rem',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s ease',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: '#9ca3af',
  marginBottom: '0.35rem',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

// ─── Stock Badge ─────────────────────────────────────────────────────────────

function StockBadge({ stock }: { stock: number }) {
  const config =
    stock === 0
      ? { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', label: 'Out' }
      : stock <= 2
      ? { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', label: 'Low' }
      : { bg: 'rgba(52,211,153,0.12)', color: '#34d399', label: 'In Stock' }

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      background: config.bg, color: config.color,
      padding: '0.2rem 0.55rem', borderRadius: '6px',
      fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.03em',
    }}>
      <span style={{
        width: '5px', height: '5px', borderRadius: '50%',
        background: config.color, display: 'inline-block',
      }} />
      {stock > 0 ? `${stock} · ` : ''}{config.label}
    </span>
  )
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      style={{
        width: '38px', height: '22px', borderRadius: '11px',
        background: checked ? '#EC1E79' : '#2a2a2a',
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background 0.2s ease', flexShrink: 0,
        padding: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: '3px',
        left: checked ? '19px' : '3px',
        width: '16px', height: '16px', borderRadius: '50%',
        background: '#fff', transition: 'left 0.2s ease',
        boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
      }} />
    </button>
  )
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '48px 1fr 110px 90px 80px 70px 60px 60px 90px',
      gap: '1rem', alignItems: 'center',
      padding: '0.875rem 1.25rem',
      borderBottom: '1px solid #161616',
    }}>
      {[48, 200, 90, 70, 70, 50, 38, 38, 80].map((w, i) => (
        <div key={i} style={{
          height: '14px', width: `${w}px`, maxWidth: '100%',
          background: 'linear-gradient(90deg, #1a1a1a 25%, #222 50%, #1a1a1a 75%)',
          backgroundSize: '200% 100%',
          borderRadius: '6px',
          animation: 'shimmer 1.4s infinite',
        }} />
      ))}
    </div>
  )
}

// ─── Image URL Input ──────────────────────────────────────────────────────────

function ImageUrlInput({ images, onChange }: { images: string[]; onChange: (imgs: string[]) => void }) {
  const [input, setInput] = useState('')

  const add = () => {
    const url = input.trim()
    if (url && !images.includes(url)) {
      onChange([...images, url])
      setInput('')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          style={{ ...inputStyle, flex: 1 }}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder="Paste image URL and press Enter or Add"
        />
        <button
          type="button"
          onClick={add}
          style={{
            padding: '0.65rem 1rem', background: '#1f1f1f',
            border: '1px solid #2a2a2a', borderRadius: '8px',
            color: '#9ca3af', cursor: 'pointer', fontSize: '0.8rem',
            fontWeight: 600, whiteSpace: 'nowrap',
          }}
        >
          Add
        </button>
      </div>
      {images.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
          {images.map((url, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <img
                src={url}
                alt=""
                style={{
                  width: '64px', height: '64px', borderRadius: '8px',
                  objectFit: 'cover', border: '1px solid #2a2a2a',
                  display: 'block',
                }}
                onError={e => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
              <button
                onClick={() => onChange(images.filter((_, j) => j !== i))}
                style={{
                  position: 'absolute', top: '-6px', right: '-6px',
                  width: '18px', height: '18px', borderRadius: '50%',
                  background: '#ef4444', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff',
                }}
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Product Form Modal ───────────────────────────────────────────────────────

function ProductModal({
  product,
  onClose,
  onSave,
}: {
  product: Product | null
  onClose: () => void
  onSave: () => void
}) {
  const initialForm: FormData = product
    ? {
        name: product.name,
        category: product.category,
        price: String(product.price),
        comparePrice: product.comparePrice != null ? String(product.comparePrice) : '',
        stock: String(product.stock),
        grade: product.grade ?? '',
        grader: product.grader ?? 'PSA',
        description: product.description ?? '',
        tags: product.tags.join(', '),
        featured: product.featured,
        active: product.active,
        images: product.images,
      }
    : { ...EMPTY_FORM }

  const [form, setForm] = useState<FormData>(initialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const update = <K extends keyof FormData>(k: K, v: FormData[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name.trim() || !form.price || !form.stock) {
      setError('Name, price and stock are required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const body = {
        name: form.name.trim(),
        category: form.category,
        price: Number(form.price),
        comparePrice: form.comparePrice ? Number(form.comparePrice) : null,
        stock: Number(form.stock),
        grade: form.category === 'graded' ? form.grade || null : null,
        grader: form.category === 'graded' ? form.grader || null : null,
        description: form.description || null,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        featured: form.featured,
        active: form.active,
        images: form.images,
      }
      const url = product ? `/api/admin/products/${product.id}` : '/api/admin/products'
      const method = product ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Save failed')
      }
      onSave()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save product. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 12 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        onClick={e => e.stopPropagation()}
        className="products-slide-over"
        style={{
          background: '#111', border: '1px solid #1f1f1f', borderRadius: '20px',
          padding: '2rem', width: '100%', maxWidth: '600px',
          maxHeight: '92vh', overflowY: 'auto', color: '#fff',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
          <div>
            <h2 style={{ fontWeight: 800, fontSize: '1.2rem', margin: 0 }}>
              {product ? 'Edit Product' : 'Add New Product'}
            </h2>
            <p style={{ color: '#4b5563', fontSize: '0.8125rem', margin: '0.25rem 0 0' }}>
              {product ? `Editing: ${product.name}` : 'Fill in the details below'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#1a1a1a', border: '1px solid #2a2a2a', cursor: 'pointer',
              color: '#6b7280', padding: '6px', borderRadius: '8px', display: 'flex',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.25rem',
            color: '#fca5a5', fontSize: '0.875rem', display: 'flex', gap: '0.5rem', alignItems: 'center',
          }}>
            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* Name */}
          <div style={{ gridColumn: '1/-1' }}>
            <label style={labelStyle}>Product Name *</label>
            <input
              style={inputStyle} value={form.name}
              onChange={e => update('name', e.target.value)}
              placeholder="e.g. Charizard VMAX Rainbow Rare"
            />
          </div>

          {/* Category */}
          <div>
            <label style={labelStyle}>Category *</label>
            <select
              style={{ ...inputStyle, cursor: 'pointer' }}
              value={form.category}
              onChange={e => update('category', e.target.value)}
            >
              <option value="single">Single</option>
              <option value="graded">Graded</option>
              <option value="booster">Booster</option>
              <option value="sealed">Sealed</option>
            </select>
          </div>

          {/* Stock */}
          <div>
            <label style={labelStyle}>Stock *</label>
            <input
              style={inputStyle} type="number" min="0"
              value={form.stock}
              onChange={e => update('stock', e.target.value)}
              placeholder="0"
            />
          </div>

          {/* Price */}
          <div>
            <label style={labelStyle}>Price (£) *</label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                color: '#4b5563', fontSize: '0.875rem', fontWeight: 600, pointerEvents: 'none',
              }}>£</span>
              <input
                style={{ ...inputStyle, paddingLeft: '1.75rem' }}
                type="number" min="0" step="0.01"
                value={form.price}
                onChange={e => update('price', e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Compare Price */}
          <div>
            <label style={labelStyle}>Compare Price (£)</label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                color: '#4b5563', fontSize: '0.875rem', fontWeight: 600, pointerEvents: 'none',
              }}>£</span>
              <input
                style={{ ...inputStyle, paddingLeft: '1.75rem' }}
                type="number" min="0" step="0.01"
                value={form.comparePrice}
                onChange={e => update('comparePrice', e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Grade + Grader (only for graded) */}
          {form.category === 'graded' && (
            <>
              <div>
                <label style={labelStyle}>Grade</label>
                <input
                  style={inputStyle} value={form.grade}
                  onChange={e => update('grade', e.target.value)}
                  placeholder="e.g. PSA 10"
                />
              </div>
              <div>
                <label style={labelStyle}>Grader</label>
                <select
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  value={form.grader}
                  onChange={e => update('grader', e.target.value)}
                >
                  <option value="PSA">PSA</option>
                  <option value="CGC">CGC</option>
                  <option value="ACE">ACE</option>
                  <option value="BGS">BGS</option>
                </select>
              </div>
            </>
          )}

          {/* Description */}
          <div style={{ gridColumn: '1/-1' }}>
            <label style={labelStyle}>Description</label>
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: '88px' }}
              value={form.description}
              onChange={e => update('description', e.target.value)}
              placeholder="Describe the product..."
            />
          </div>

          {/* Tags */}
          <div style={{ gridColumn: '1/-1' }}>
            <label style={labelStyle}>Tags (comma-separated)</label>
            <div style={{ position: 'relative' }}>
              <Tag size={14} color="#4b5563" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                style={{ ...inputStyle, paddingLeft: '2rem' }}
                value={form.tags}
                onChange={e => update('tags', e.target.value)}
                placeholder="charizard, holo, rare"
              />
            </div>
          </div>

          {/* Images */}
          <div style={{ gridColumn: '1/-1' }}>
            <label style={labelStyle}>Images</label>
            <ImageUrlInput
              images={form.images}
              onChange={imgs => update('images', imgs)}
            />
          </div>

          {/* Featured + Active */}
          <div style={{
            gridColumn: '1/-1', display: 'flex', gap: '1.5rem',
            padding: '1rem', background: '#0d0d0d', borderRadius: '10px',
            border: '1px solid #1a1a1a',
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', flex: 1 }}>
              <input
                type="checkbox"
                checked={form.featured}
                onChange={e => update('featured', e.target.checked)}
                style={{ display: 'none' }}
              />
              <ToggleSwitch
                checked={form.featured}
                onChange={() => update('featured', !form.featured)}
              />
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#d1d5db' }}>Featured</div>
                <div style={{ fontSize: '0.75rem', color: '#4b5563' }}>Show on homepage</div>
              </div>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', flex: 1 }}>
              <input
                type="checkbox"
                checked={form.active}
                onChange={e => update('active', e.target.checked)}
                style={{ display: 'none' }}
              />
              <ToggleSwitch
                checked={form.active}
                onChange={() => update('active', !form.active)}
              />
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#d1d5db' }}>Active</div>
                <div style={{ fontSize: '0.75rem', color: '#4b5563' }}>Visible in shop</div>
              </div>
            </label>
          </div>
        </div>

        {/* Footer Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '0.75rem', borderRadius: '10px',
              background: '#1a1a1a', border: '1px solid #2a2a2a',
              color: '#9ca3af', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem',
              transition: 'background 0.15s ease',
            }}
          >
            Cancel
          </button>
          <motion.button
            onClick={handleSave}
            disabled={saving}
            whileHover={{ scale: saving ? 1 : 1.02 }}
            whileTap={{ scale: saving ? 1 : 0.98 }}
            style={{
              flex: 2, padding: '0.75rem', borderRadius: '10px',
              background: saving ? '#00a885' : '#EC1E79',
              border: 'none', color: '#000', fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '0.4rem',
              transition: 'background 0.15s ease',
            }}
          >
            {saving ? (
              <>
                <span style={{
                  width: '14px', height: '14px', border: '2px solid rgba(0,0,0,0.3)',
                  borderTopColor: '#000', borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite', display: 'inline-block',
                }} />
                Saving...
              </>
            ) : (
              <><Check size={16} /> {product ? 'Save Changes' : 'Add Product'}</>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [gameFilter, setGameFilter] = useState<GameFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [stockFilter, setStockFilter] = useState<StockFilter>('all')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')

  // Pagination
  const [page, setPage] = useState(1)
  const LIMIT = 20

  // Modal / edit
  const [editProduct, setEditProduct] = useState<Product | null | 'new'>()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearchChange = (val: string) => {
    setSearch(val)
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(val)
      setPage(1)
    }, 400)
  }

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (categoryFilter !== 'all') params.set('category', categoryFilter)
    if (gameFilter !== 'all') params.set('game', gameFilter)
    if (stockFilter === 'in') params.set('stockMin', '3')
    if (stockFilter === 'low') { params.set('stockMin', '1'); params.set('stockMax', '2') }
    if (stockFilter === 'out') params.set('stockMax', '0')
    if (activeFilter === 'active') params.set('active', 'true')
    if (activeFilter === 'inactive') params.set('active', 'false')
    params.set('page', String(page))
    params.set('limit', String(LIMIT))
    return `/api/admin/products?${params.toString()}`
  }, [debouncedSearch, categoryFilter, gameFilter, stockFilter, activeFilter, page])

  const loadProducts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(buildUrl())
      if (!res.ok) throw new Error('Failed to load products')
      const data = await res.json()
      // Support { products, total } or plain array
      if (Array.isArray(data)) {
        setProducts(data)
        setTotal(data.length)
      } else {
        setProducts(data.products ?? [])
        setTotal(data.total ?? data.products?.length ?? 0)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load products')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [buildUrl])

  useEffect(() => { loadProducts() }, [loadProducts])

  // Reset page when filters change
  useEffect(() => { setPage(1) }, [categoryFilter, gameFilter, stockFilter, activeFilter])

  const handleToggleFeatured = async (product: Product) => {
    try {
      await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !product.featured }),
      })
      loadProducts()
    } catch {
      /* silent fail - optimistic would need rollback */
    }
  }

  const handleToggleActive = async (product: Product) => {
    try {
      await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !product.active }),
      })
      loadProducts()
    } catch {
      /* silent fail */
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
      setDeleteId(null)
      loadProducts()
    } catch {
      setError('Failed to delete product.')
    }
  }

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/products/${id}/duplicate`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data?.error || 'Failed to duplicate product.')
        return
      }
      loadProducts()
    } catch {
      setError('Failed to duplicate product.')
    }
  }

  const totalPages = Math.ceil(total / LIMIT)

  const CATEGORY_PILLS: { label: string; value: CategoryFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Singles', value: 'single' },
    { label: 'Graded', value: 'graded' },
    { label: 'Boosters', value: 'booster' },
    { label: 'Sealed', value: 'sealed' },
  ]

  const GAME_PILLS: { label: string; value: GameFilter }[] = [
    { label: 'All Games', value: 'all' },
    { label: 'Pokémon', value: 'pokemon' },
    { label: 'One Piece', value: 'one-piece' },
  ]

  const STOCK_OPTIONS: { label: string; value: StockFilter }[] = [
    { label: 'All Stock', value: 'all' },
    { label: 'In Stock', value: 'in' },
    { label: 'Low Stock', value: 'low' },
    { label: 'Out of Stock', value: 'out' },
  ]

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .product-row:hover { background: #161616 !important; }
        .action-btn:hover { opacity: 1 !important; }
        .pill-btn:hover { border-color: #2f2f2f !important; background: #1a1a1a !important; }
        .delete-hover:hover { background: rgba(239,68,68,0.15) !important; border-color: rgba(239,68,68,0.35) !important; color: #ef4444 !important; }
        .edit-hover:hover { background: rgba(129,140,248,0.15) !important; border-color: rgba(129,140,248,0.35) !important; color: #818cf8 !important; }
        input:focus, select:focus, textarea:focus { border-color: #2f2f2f !important; }
        @media (max-width: 768px) {
          .products-header { flex-direction: column !important; align-items: flex-start !important; }
          .products-slide-over { width: min(460px, 100vw) !important; max-width: 100vw !important; }
          .products-page-padding { padding: 1.25rem !important; }
          .products-table-container { overflow-x: auto !important; }
        }
      `}</style>

      <div className="products-page-padding" style={{ padding: '2rem 2.25rem', color: '#fff', minHeight: '100vh' }}>

        {/* ── Header ── */}
        <div className="products-header" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>
                Products
              </h1>
              <span style={{
                background: 'rgba(236,30,121,0.12)', color: '#EC1E79',
                border: '1px solid rgba(236,30,121,0.2)',
                padding: '0.2rem 0.65rem', borderRadius: '20px',
                fontSize: '0.75rem', fontWeight: 700,
              }}>
                {total}
              </span>
            </div>
            <p style={{ color: '#4b5563', fontSize: '0.875rem', margin: '0.3rem 0 0' }}>
              Manage your Pokemon card catalogue
            </p>
          </div>

          <motion.button
            onClick={() => setEditProduct('new')}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: '#EC1E79', color: '#000',
              padding: '0.7rem 1.25rem', borderRadius: '10px',
              border: 'none', cursor: 'pointer', fontWeight: 700,
              fontSize: '0.875rem', boxShadow: '0 4px 14px rgba(236,30,121,0.25)',
            }}
          >
            <Plus size={16} />
            Add Product
          </motion.button>
        </div>

        {/* ── Error Banner ── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              style={{
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '12px', padding: '0.875rem 1rem',
                marginBottom: '1.25rem', color: '#fca5a5',
                fontSize: '0.875rem', display: 'flex',
                alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={15} />
                {error}
              </div>
              <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Filters Bar ── */}
        <div style={{
          background: '#111', border: '1px solid #1f1f1f', borderRadius: '14px',
          padding: '1rem 1.25rem', marginBottom: '1.25rem',
          display: 'flex', flexWrap: 'wrap', gap: '0.875rem', alignItems: 'center',
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1', minWidth: '220px', maxWidth: '320px' }}>
            <Search size={14} color="#4b5563" style={{
              position: 'absolute', left: '12px', top: '50%',
              transform: 'translateY(-50%)', pointerEvents: 'none',
            }} />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              style={{
                width: '100%', padding: '0.6rem 2rem 0.6rem 2.25rem',
                background: '#161616', border: '1px solid #1f1f1f',
                borderRadius: '9px', color: '#fff', fontSize: '0.875rem',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
            {search && (
              <button
                onClick={() => { setSearch(''); setDebouncedSearch('') }}
                style={{
                  position: 'absolute', right: '10px', top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', cursor: 'pointer', color: '#4b5563',
                  display: 'flex',
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Divider */}
          <div style={{ width: '1px', height: '28px', background: '#1f1f1f', flexShrink: 0 }} />

          {/* Game Pills */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {GAME_PILLS.map(pill => (
              <button
                key={pill.value}
                className="pill-btn"
                onClick={() => setGameFilter(pill.value)}
                style={{
                  padding: '0.35rem 0.8rem', borderRadius: '8px',
                  border: '1px solid',
                  borderColor: gameFilter === pill.value ? 'rgba(236,30,121,0.5)' : '#1f1f1f',
                  background: gameFilter === pill.value ? '#EC1E79' : 'transparent',
                  color: gameFilter === pill.value ? '#fff' : '#9ca3af',
                  cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 700,
                  transition: 'all 0.15s ease',
                }}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div style={{ width: '1px', height: '28px', background: '#1f1f1f', flexShrink: 0 }} />

          {/* Category Pills */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {CATEGORY_PILLS.map(pill => (
              <button
                key={pill.value}
                className="pill-btn"
                onClick={() => setCategoryFilter(pill.value)}
                style={{
                  padding: '0.35rem 0.8rem', borderRadius: '8px',
                  border: '1px solid',
                  borderColor: categoryFilter === pill.value ? 'rgba(255,255,255,0.25)' : '#1f1f1f',
                  background: categoryFilter === pill.value ? 'rgba(255,255,255,0.06)' : 'transparent',
                  color: categoryFilter === pill.value ? '#fff' : '#9ca3af',
                  cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600,
                  transition: 'all 0.15s ease',
                }}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div style={{ width: '1px', height: '28px', background: '#1f1f1f', flexShrink: 0 }} />

          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={e => setStockFilter(e.target.value as StockFilter)}
            style={{
              padding: '0.4rem 0.8rem', borderRadius: '8px',
              border: '1px solid #1f1f1f', background: '#161616',
              color: '#9ca3af', fontSize: '0.8125rem', cursor: 'pointer',
              outline: 'none', fontWeight: 600,
            }}
          >
            {STOCK_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Active Toggle */}
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {(['all', 'active', 'inactive'] as const).map(val => (
              <button
                key={val}
                className="pill-btn"
                onClick={() => setActiveFilter(val)}
                style={{
                  padding: '0.35rem 0.8rem', borderRadius: '8px',
                  border: '1px solid',
                  borderColor: activeFilter === val ? '#2f2f2f' : '#1f1f1f',
                  background: activeFilter === val ? '#1f1f1f' : 'transparent',
                  color: activeFilter === val ? '#fff' : '#4b5563',
                  cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600,
                  transition: 'all 0.15s ease', textTransform: 'capitalize',
                }}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* ── Table ── */}
        <div style={{
          background: '#111', border: '1px solid #1f1f1f',
          borderRadius: '16px', overflow: 'hidden',
        }}>
          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '48px 1fr 120px 100px 90px 90px 52px 60px 96px',
            gap: '0.75rem', alignItems: 'center',
            padding: '0.75rem 1.25rem',
            borderBottom: '1px solid #1a1a1a',
            fontSize: '0.7rem', fontWeight: 700, color: '#4b5563',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            <span />
            <span>Product</span>
            <span>Category</span>
            <span>Price</span>
            <span>Stock</span>
            <span>Grade</span>
            <span style={{ textAlign: 'center' }}>Star</span>
            <span style={{ textAlign: 'center' }}>Active</span>
            <span style={{ textAlign: 'right' }}>Actions</span>
          </div>

          {/* Loading Skeletons */}
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
          ) : products.length === 0 ? (
            /* Empty State */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                padding: '5rem 2rem', textAlign: 'center',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
              }}
            >
              <div style={{
                width: '64px', height: '64px', borderRadius: '16px',
                background: '#161616', border: '1px solid #1f1f1f',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Package size={28} color="#4b5563" />
              </div>
              <div>
                <p style={{ color: '#9ca3af', fontWeight: 600, fontSize: '1rem', margin: 0 }}>No products found</p>
                <p style={{ color: '#4b5563', fontSize: '0.875rem', margin: '0.4rem 0 0' }}>
                  {debouncedSearch || categoryFilter !== 'all' || stockFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Add your first product to get started'}
                </p>
              </div>
              {!debouncedSearch && categoryFilter === 'all' && stockFilter === 'all' && (
                <button
                  onClick={() => setEditProduct('new')}
                  style={{
                    marginTop: '0.5rem', padding: '0.65rem 1.25rem',
                    background: '#EC1E79', color: '#000', border: 'none',
                    borderRadius: '10px', cursor: 'pointer', fontWeight: 700,
                    fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem',
                  }}
                >
                  <Plus size={15} /> Add First Product
                </button>
              )}
            </motion.div>
          ) : (
            /* Product Rows */
            <AnimatePresence initial={false}>
              {products.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ delay: Math.min(i * 0.025, 0.2) }}
                  className="product-row"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '48px 1fr 120px 100px 90px 90px 52px 60px 96px',
                    gap: '0.75rem', alignItems: 'center',
                    padding: '0.875rem 1.25rem',
                    borderBottom: '1px solid #161616',
                    transition: 'background 0.15s ease',
                    background: deleteId === product.id ? 'rgba(239,68,68,0.04)' : 'transparent',
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '8px',
                    background: '#161616', border: '1px solid #1f1f1f',
                    overflow: 'hidden', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => {
                          const t = e.currentTarget
                          t.style.display = 'none'
                          t.nextElementSibling && ((t.nextElementSibling as HTMLElement).style.display = 'flex')
                        }}
                      />
                    ) : null}
                    {!product.images?.[0] && <ImageIcon size={16} color="#4b5563" />}
                  </div>

                  {/* Name + tags */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontWeight: 600, fontSize: '0.875rem',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      color: product.active ? '#fff' : '#6b7280',
                    }}>
                      {product.name}
                    </div>
                    {product.tags.length > 0 && (
                      <div style={{
                        fontSize: '0.7rem', color: '#4b5563', marginTop: '0.2rem',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {product.tags.slice(0, 3).join(' · ')}
                      </div>
                    )}
                  </div>

                  {/* Category */}
                  {(() => {
                    const cat = CATEGORY_COLORS[product.category] ?? { bg: '#1a1a1a', color: '#9ca3af', label: product.category }
                    return (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center',
                        background: cat.bg, color: cat.color,
                        padding: '0.25rem 0.6rem', borderRadius: '6px',
                        fontSize: '0.7rem', fontWeight: 700,
                        letterSpacing: '0.03em', width: 'fit-content',
                      }}>
                        {cat.label}
                      </span>
                    )
                  })()}

                  {/* Price */}
                  <div>
                    <div style={{ fontWeight: 700, color: '#EC1E79', fontSize: '0.9rem' }}>
                      £{product.price.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    {product.comparePrice && (
                      <div style={{ fontSize: '0.7rem', color: '#4b5563', textDecoration: 'line-through' }}>
                        £{product.comparePrice.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    )}
                  </div>

                  {/* Stock Badge */}
                  <StockBadge stock={product.stock} />

                  {/* Grade */}
                  <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                    {product.grade ? (
                      <span style={{
                        background: 'rgba(129,140,248,0.1)', color: '#818cf8',
                        padding: '0.2rem 0.5rem', borderRadius: '5px',
                        fontSize: '0.7rem', fontWeight: 600,
                      }}>
                        {product.grader} {product.grade}
                      </span>
                    ) : (
                      <span style={{ color: '#2a2a2a' }}>—</span>
                    )}
                  </div>

                  {/* Featured Star */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button
                      onClick={() => handleToggleFeatured(product)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: '4px', borderRadius: '6px', display: 'flex',
                        transition: 'transform 0.15s ease',
                      }}
                      title={product.featured ? 'Remove from featured' : 'Mark as featured'}
                    >
                      <Star
                        size={17}
                        fill={product.featured ? '#f59e0b' : 'none'}
                        color={product.featured ? '#f59e0b' : '#2a2a2a'}
                        style={{ transition: 'all 0.15s ease' }}
                      />
                    </button>
                  </div>

                  {/* Active Toggle */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <ToggleSwitch
                      checked={product.active}
                      onChange={() => handleToggleActive(product)}
                    />
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                    {deleteId === product.id ? (
                      /* Inline delete confirmation */
                      <AnimatePresence>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.92 }}
                          animate={{ opacity: 1, scale: 1 }}
                          style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}
                        >
                          <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 600, whiteSpace: 'nowrap' }}>Sure?</span>
                          <button
                            onClick={() => handleDelete(product.id)}
                            style={{
                              background: '#ef4444', border: 'none', borderRadius: '6px',
                              padding: '5px 8px', cursor: 'pointer', color: '#fff',
                              fontSize: '0.7rem', fontWeight: 700,
                            }}
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setDeleteId(null)}
                            style={{
                              background: '#1f1f1f', border: '1px solid #2a2a2a',
                              borderRadius: '6px', padding: '5px 8px',
                              cursor: 'pointer', color: '#9ca3af',
                              fontSize: '0.7rem', fontWeight: 700,
                            }}
                          >
                            No
                          </button>
                        </motion.div>
                      </AnimatePresence>
                    ) : (
                      <>
                        <button
                          className="edit-hover"
                          onClick={() => setEditProduct(product)}
                          style={{
                            background: 'rgba(129,140,248,0.08)',
                            border: '1px solid rgba(129,140,248,0.15)',
                            borderRadius: '8px', padding: '6px',
                            cursor: 'pointer', display: 'flex',
                            color: '#818cf8', transition: 'all 0.15s ease',
                          }}
                          title="Edit product"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDuplicate(product.id)}
                          style={{
                            background: 'rgba(236,30,121,0.08)',
                            border: '1px solid rgba(236,30,121,0.15)',
                            borderRadius: '8px', padding: '6px',
                            cursor: 'pointer', display: 'flex',
                            color: '#EC1E79', transition: 'all 0.15s ease',
                          }}
                          title="Duplicate product"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          className="delete-hover"
                          onClick={() => setDeleteId(product.id)}
                          style={{
                            background: 'rgba(239,68,68,0.08)',
                            border: '1px solid rgba(239,68,68,0.15)',
                            borderRadius: '8px', padding: '6px',
                            cursor: 'pointer', display: 'flex',
                            color: '#ef4444', transition: 'all 0.15s ease',
                          }}
                          title="Delete product"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginTop: '1.25rem', padding: '0.75rem 0',
          }}>
            <span style={{ color: '#4b5563', fontSize: '0.875rem' }}>
              Page {page} of {totalPages} · {total} products
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.5rem 1rem', borderRadius: '9px',
                  background: '#111', border: '1px solid #1f1f1f',
                  color: page === 1 ? '#2a2a2a' : '#9ca3af',
                  cursor: page === 1 ? 'default' : 'pointer',
                  fontSize: '0.875rem', fontWeight: 600,
                  transition: 'all 0.15s ease',
                }}
              >
                <ChevronLeft size={15} /> Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.5rem 1rem', borderRadius: '9px',
                  background: '#111', border: '1px solid #1f1f1f',
                  color: page === totalPages ? '#2a2a2a' : '#9ca3af',
                  cursor: page === totalPages ? 'default' : 'pointer',
                  fontSize: '0.875rem', fontWeight: 600,
                  transition: 'all 0.15s ease',
                }}
              >
                Next <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Add/Edit Modal ── */}
      <AnimatePresence>
        {editProduct !== undefined && (
          <ProductModal
            product={editProduct === 'new' ? null : editProduct}
            onClose={() => setEditProduct(undefined)}
            onSave={loadProducts}
          />
        )}
      </AnimatePresence>
    </>
  )
}
