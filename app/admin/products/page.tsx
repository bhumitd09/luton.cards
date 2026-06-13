'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Pencil, Trash2, Search, X, Check, AlertTriangle,
  Package, Star, ChevronLeft, ChevronRight, ToggleLeft, ToggleRight,
  Image as ImageIcon, Tag, Copy,
} from 'lucide-react'
import { ImageUploader } from '@/components/admin/image-uploader'
import { useToast } from '@/components/admin/toast'
import { CONDITIONS, FOILS } from '@/lib/conditions'

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
  vendorId?: string | null
  vendor?: { id: string; name: string | null; email: string } | null
  /** Loaded by /api/admin/products and /api/admin/products/[id]. May be
   *  undefined for older callers that don't fetch variants. */
  variants?: {
    id: string
    condition: string
    foil: string | null
    price: number
    stock: number
    active: boolean
    sku?: string | null
  }[]
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

// Variant row in the editor — strings for inputs, normalised at save time.
// foil = '' means "no foil specified" (saved as null on the server).
type VariantRow = {
  condition: string
  foil: string
  price: string
  stock: string
  sku: string
  active: boolean
}

const EMPTY_FORM = {
  name: '',
  game: 'pokemon',
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
  variants: [] as VariantRow[],
}

type FormData = typeof EMPTY_FORM

// ─── Shared Styles ───────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.6rem 0.8rem',
  background: '#0c0c0d',
  border: '1px solid #202022',
  borderRadius: '11px',
  color: '#fff',
  fontSize: '0.9rem',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s ease',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.7rem',
  fontWeight: 700,
  color: '#9ca3af',
  marginBottom: '0.4rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
}

// ─── Stock Badge ─────────────────────────────────────────────────────────────

function StockBadge({ stock }: { stock: number }) {
  const config =
    stock === 0
      ? { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)', color: '#ef4444', label: 'Out' }
      : stock <= 2
      ? { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', color: '#f59e0b', label: 'Low' }
      : { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', color: '#10b981', label: 'In Stock' }

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
      background: config.bg, color: config.color,
      border: `1px solid ${config.border}`,
      padding: '0.2rem 0.6rem', borderRadius: '999px',
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
        width: '38px', height: '22px', borderRadius: '999px',
        background: checked ? 'linear-gradient(135deg,#EC1E79,#FF4DA6)' : '#161617',
        border: checked ? 'none' : '1px solid #202022',
        cursor: 'pointer', position: 'relative',
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
      padding: '0.875rem 1.35rem',
      borderBottom: '1px solid #1a1a1c',
    }}>
      {[48, 200, 90, 70, 70, 50, 38, 38, 80].map((w, i) => (
        <div key={i} style={{
          height: '14px', width: `${w}px`, maxWidth: '100%',
          background: 'linear-gradient(90deg, #161617 25%, #202022 50%, #161617 75%)',
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
            padding: '0.6rem 1rem', background: '#161617',
            border: '1px solid #202022', borderRadius: '11px',
            color: '#e4e4e7', cursor: 'pointer', fontSize: '0.85rem',
            fontWeight: 700, whiteSpace: 'nowrap',
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
                  width: '64px', height: '64px', borderRadius: '11px',
                  objectFit: 'cover', border: '1px solid #202022',
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
        game: product.game === 'one-piece' ? 'one-piece' : 'pokemon',
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
        // Variants come back from the API with numeric prices + condition/foil
        // slugs; the editor stores them as strings so inputs are uncontrolled-friendly.
        variants: (product.variants ?? []).map(v => ({
          condition: v.condition,
          foil: v.foil ?? '',
          price: String(v.price),
          stock: String(v.stock),
          sku: v.sku ?? '',
          active: v.active !== false,
        })),
      }
    : { ...EMPTY_FORM, variants: [] }

  const [form, setForm] = useState<FormData>(initialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()

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
      // Validate variants: every row must have a condition + numeric price + stock.
      // We allow zero stock (sold-out variants stay listed); reject NaN / negative.
      const cleanedVariants = form.variants.map(v => ({
        condition: v.condition,
        foil: v.foil || null,
        price: Number(v.price),
        stock: Number.parseInt(v.stock || '0', 10),
        sku: v.sku?.trim() || null,
        active: v.active !== false,
      }))
      for (const v of cleanedVariants) {
        if (!v.condition || !Number.isFinite(v.price) || v.price < 0 || !Number.isInteger(v.stock) || v.stock < 0) {
          setError('Each variant needs a condition, a valid price, and a non-negative stock.')
          setSaving(false)
          return
        }
      }

      const body = {
        name: form.name.trim(),
        game: form.game,
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
        // Always send the array (possibly empty) so existing variants can be
        // cleared by emptying the editor. The PUT route treats missing field
        // as "leave alone" — that branch is only used by other patch paths.
        variants: cleanedVariants,
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
      toast.success(product ? 'Product updated' : 'Product created')
      onSave()
      onClose()
    } catch (err: unknown) {
      toast.error('Could not save product')
      setError(err instanceof Error ? err.message : 'Failed to save product. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
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
          background: '#0f0f10', border: '1px solid #202022', borderRadius: '16px',
          padding: '1.75rem', width: '100%', maxWidth: '600px',
          maxHeight: '92vh', overflowY: 'auto', color: '#fff',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* Modal Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: '1px solid #1a1a1c',
        }}>
          <div>
            <h2 style={{ fontWeight: 900, fontSize: '1.2rem', margin: 0, letterSpacing: '-0.025em', color: '#f4f4f5' }}>
              {product ? 'Edit Product' : 'Add New Product'}
            </h2>
            <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
              {product ? `Editing: ${product.name}` : 'Fill in the details below'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#161617', border: '1px solid #202022', cursor: 'pointer',
              color: '#9ca3af', padding: '7px', borderRadius: '11px', display: 'flex',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '11px', padding: '0.75rem 1rem', marginBottom: '1.25rem',
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

          {/* Game */}
          <div>
            <label style={labelStyle}>Game *</label>
            <select
              style={{ ...inputStyle, cursor: 'pointer' }}
              value={form.game}
              onChange={e => update('game', e.target.value)}
            >
              <option value="pokemon">Pokémon</option>
              <option value="one-piece">One Piece</option>
            </select>
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
                color: '#6b7280', fontSize: '0.9rem', fontWeight: 600, pointerEvents: 'none',
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
                color: '#6b7280', fontSize: '0.9rem', fontWeight: 600, pointerEvents: 'none',
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
              <Tag size={14} color="#6b7280" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
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
            <ImageUploader
              images={form.images}
              onChange={imgs => update('images', imgs)}
              max={8}
              label="Images — up to 8 angles"
            />
          </div>

          {/* Featured + Active */}
          <div style={{
            gridColumn: '1/-1', display: 'flex', gap: '1.5rem',
            padding: '1rem', background: '#161617', borderRadius: '11px',
            border: '1px solid #202022',
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
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f4f4f5' }}>Featured</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Show on homepage</div>
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
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f4f4f5' }}>Active</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Visible in shop</div>
              </div>
            </label>
          </div>
        </div>

        {/* Conditions / variants — when present, the storefront shows a
            selector and uses these prices/stocks instead of the base price. */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #1a1a1c' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '0.5rem', gap: '0.75rem' }}>
            <div>
              <label style={{ ...labelStyle, marginBottom: 4 }}>Conditions / variants</label>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>
                Add one row per condition you stock (Near Mint, Lightly Played, etc.). Optional foil per row.
                Buyers will see a selector. Leave empty to keep using the base price + stock above.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                // Pre-pick the first condition + foil not already used so adding
                // a row never collides with an existing (condition, foil) row.
                const used = new Set(form.variants.map(v => `${v.condition}|${v.foil}`))
                const nextCond = CONDITIONS.find(c => !used.has(`${c.slug}|`))?.slug ?? CONDITIONS[0].slug
                update('variants', [
                  ...form.variants,
                  { condition: nextCond, foil: '', price: form.price || '', stock: '0', sku: '', active: true },
                ])
              }}
              style={{
                background: '#161617', border: '1px solid #202022', color: '#e4e4e7',
                fontSize: '0.78rem', fontWeight: 700, padding: '0.45rem 0.85rem',
                borderRadius: 11, cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              + Add variant
            </button>
          </div>

          {form.variants.length === 0 ? (
            <div style={{
              padding: '0.85rem 1rem', background: '#0c0c0d', border: '1px dashed #202022',
              borderRadius: 12, fontSize: '0.8rem', color: '#6b7280',
            }}>
              No variants yet — this product will sell at the base price above.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {form.variants.map((v, i) => (
                <div
                  key={i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.4fr 1.2fr 0.9fr 0.7fr 1fr auto auto',
                    gap: '0.5rem',
                    alignItems: 'center',
                    background: '#0c0c0d',
                    border: '1px solid #202022',
                    borderRadius: 11,
                    padding: '0.5rem',
                  }}
                >
                  <select
                    value={v.condition}
                    onChange={e => update('variants', form.variants.map((x, j) => j === i ? { ...x, condition: e.target.value } : x))}
                    style={{ ...inputStyle, padding: '0.5rem 0.65rem', fontSize: '0.82rem' }}
                  >
                    {CONDITIONS.map(c => <option key={c.slug} value={c.slug}>{c.label}</option>)}
                  </select>
                  <select
                    value={v.foil}
                    onChange={e => update('variants', form.variants.map((x, j) => j === i ? { ...x, foil: e.target.value } : x))}
                    style={{ ...inputStyle, padding: '0.5rem 0.65rem', fontSize: '0.82rem' }}
                  >
                    <option value="">No foil</option>
                    {FOILS.map(f => <option key={f.slug} value={f.slug}>{f.label}</option>)}
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Price"
                    value={v.price}
                    onChange={e => update('variants', form.variants.map((x, j) => j === i ? { ...x, price: e.target.value } : x))}
                    style={{ ...inputStyle, padding: '0.5rem 0.65rem', fontSize: '0.82rem' }}
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Stock"
                    value={v.stock}
                    onChange={e => update('variants', form.variants.map((x, j) => j === i ? { ...x, stock: e.target.value } : x))}
                    style={{ ...inputStyle, padding: '0.5rem 0.65rem', fontSize: '0.82rem' }}
                  />
                  <input
                    type="text"
                    placeholder="SKU"
                    value={v.sku}
                    onChange={e => update('variants', form.variants.map((x, j) => j === i ? { ...x, sku: e.target.value } : x))}
                    style={{ ...inputStyle, padding: '0.5rem 0.65rem', fontSize: '0.82rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => update('variants', form.variants.map((x, j) => j === i ? { ...x, active: !x.active } : x))}
                    aria-label={v.active ? 'Variant active' : 'Variant inactive'}
                    title={v.active ? 'Active' : 'Inactive'}
                    style={{
                      background: v.active ? 'rgba(16,185,129,0.1)' : 'rgba(107,114,128,0.12)',
                      border: `1px solid ${v.active ? 'rgba(16,185,129,0.25)' : 'rgba(107,114,128,0.25)'}`,
                      color: v.active ? '#10b981' : '#9ca3af',
                      fontSize: '0.72rem', fontWeight: 700, padding: '0.45rem 0.5rem',
                      borderRadius: 9, cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                  >
                    {v.active ? 'Active' : 'Inactive'}
                  </button>
                  <button
                    type="button"
                    onClick={() => update('variants', form.variants.filter((_, j) => j !== i))}
                    aria-label="Remove variant"
                    style={{
                      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                      color: '#ef4444', padding: '0.45rem 0.55rem', borderRadius: 9, cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #1a1a1c' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '0.6rem 1.1rem', borderRadius: '11px',
              background: '#161617', border: '1px solid #202022',
              color: '#e4e4e7', fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem',
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
              flex: 2, padding: '0.6rem 1.1rem', borderRadius: '11px',
              background: 'linear-gradient(135deg,#EC1E79,#FF4DA6)',
              border: 'none', color: '#fff', fontWeight: 800,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
              fontSize: '0.85rem', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '0.4rem',
              boxShadow: '0 8px 22px -10px rgba(236,30,121,0.6)',
              transition: 'opacity 0.15s ease',
            }}
          >
            {saving ? (
              <>
                <span style={{
                  width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.35)',
                  borderTopColor: '#fff', borderRadius: '50%',
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
  const toast = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Current user — drives ownership UI (lock edit/delete on products
  // owned by other vendors, hide vendor column for non-superadmins).
  const [me, setMe] = useState<{ id: string; role: string } | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [gameFilter, setGameFilter] = useState<GameFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [stockFilter, setStockFilter] = useState<StockFilter>('all')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')

  // Pagination
  const [page, setPage] = useState(1)
  const LIMIT = 12

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

  // Load current admin once for ownership UI gates.
  useEffect(() => {
    fetch('/api/admin/auth')
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d?.user) setMe({ id: d.user.id, role: d.user.role }) })
      .catch(() => {})
  }, [])

  const isSuper = me?.role === 'superadmin'
  const canEditOwned = (p: Product) => {
    if (!me) return false
    if (p.vendorId === me.id) return true
    if (!p.vendorId && isSuper) return true // orphan products: superadmin can adopt
    return false
  }

  // Reset page when filters change
  useEffect(() => { setPage(1) }, [categoryFilter, gameFilter, stockFilter, activeFilter])

  const handleToggleFeatured = async (product: Product) => {
    if (!canEditOwned(product)) return // API would 403; bail early
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
    if (!canEditOwned(product)) return // ownership check — API would 403
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
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast.success('Product deleted')
      setDeleteId(null)
      loadProducts()
    } catch {
      toast.error('Could not delete product')
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
        .product-row:hover { background: #161617 !important; }
        .action-btn:hover { opacity: 1 !important; }
        .pill-btn:hover { border-color: #2a2a2c !important; background: #161617 !important; }
        .delete-hover:hover { background: rgba(239,68,68,0.15) !important; border-color: rgba(239,68,68,0.35) !important; color: #ef4444 !important; }
        .edit-hover:hover { background: rgba(236,30,121,0.15) !important; border-color: rgba(236,30,121,0.35) !important; color: #EC1E79 !important; }
        @media (max-width: 768px) {
          .products-header { flex-direction: column !important; align-items: flex-start !important; }
          .products-slide-over { width: min(460px, 100vw) !important; max-width: 100vw !important; }
          .products-page-padding { padding: 1.25rem !important; }
          .products-table-container { overflow-x: auto !important; }
        }
      `}</style>

      <div className="products-page-padding" style={{ padding: '2rem 2.25rem', color: '#f4f4f5', background: '#0a0a0a', minHeight: '100vh' }}>

        {/* ── Header ── */}
        <div className="products-header" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem',
        }}>
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              marginBottom: '0.55rem',
            }}>
              <Package size={12} color="#EC1E79" />
              <span style={{
                fontSize: '10px', fontWeight: 800, color: '#EC1E79',
                textTransform: 'uppercase', letterSpacing: '0.16em',
              }}>
                Catalogue
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{
                fontSize: 'clamp(1.4rem,2.5vw,1.75rem)', fontWeight: 900, margin: 0,
                letterSpacing: '-0.025em', color: '#fff',
              }}>
                Products
              </h1>
              <span style={{
                background: 'rgba(236,30,121,0.12)', color: '#EC1E79',
                border: '1px solid rgba(236,30,121,0.25)',
                padding: '0.2rem 0.65rem', borderRadius: '999px',
                fontSize: '0.75rem', fontWeight: 800,
              }}>
                {total}
              </span>
            </div>
            <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: '0.35rem 0 0' }}>
              Manage your Pokemon card catalogue
            </p>
          </div>

          <motion.button
            onClick={() => setEditProduct('new')}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: 'linear-gradient(135deg,#EC1E79,#FF4DA6)', color: '#fff',
              padding: '0.6rem 1.1rem', borderRadius: '11px',
              border: 'none', cursor: 'pointer', fontWeight: 800,
              fontSize: '0.85rem', boxShadow: '0 8px 22px -10px rgba(236,30,121,0.6)',
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
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: '11px', padding: '0.875rem 1rem',
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
          background: '#0f0f10', border: '1px solid #202022', borderRadius: '16px',
          padding: '1rem 1.25rem', marginBottom: '1.25rem',
          display: 'flex', flexWrap: 'wrap', gap: '0.875rem', alignItems: 'center',
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1', minWidth: '220px', maxWidth: '320px' }}>
            <Search size={14} color="#6b7280" style={{
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
                background: '#0c0c0d', border: '1px solid #202022',
                borderRadius: '11px', color: '#fff', fontSize: '0.9rem',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
            {search && (
              <button
                onClick={() => { setSearch(''); setDebouncedSearch('') }}
                style={{
                  position: 'absolute', right: '10px', top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', cursor: 'pointer', color: '#6b7280',
                  display: 'flex',
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Divider */}
          <div style={{ width: '1px', height: '28px', background: '#1a1a1c', flexShrink: 0 }} />

          {/* Game Pills */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {GAME_PILLS.map(pill => (
              <button
                key={pill.value}
                className="pill-btn"
                onClick={() => setGameFilter(pill.value)}
                style={{
                  padding: '0.35rem 0.8rem', borderRadius: '999px',
                  border: '1px solid',
                  borderColor: gameFilter === pill.value ? 'transparent' : '#202022',
                  background: gameFilter === pill.value ? 'linear-gradient(135deg,#EC1E79,#FF4DA6)' : 'transparent',
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
          <div style={{ width: '1px', height: '28px', background: '#1a1a1c', flexShrink: 0 }} />

          {/* Category Pills — SECONDARY active state (soft pink) to match
              the visual hierarchy on the public products page. */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {CATEGORY_PILLS.map(pill => {
              const isActive = categoryFilter === pill.value
              return (
                <button
                  key={pill.value}
                  className="pill-btn"
                  onClick={() => setCategoryFilter(pill.value)}
                  style={{
                    padding: '0.35rem 0.8rem', borderRadius: '999px',
                    border: '1px solid',
                    borderColor: isActive ? 'rgba(236,30,121,0.35)' : '#202022',
                    background: isActive ? 'rgba(236,30,121,0.12)' : 'transparent',
                    color: isActive ? '#FF80B8' : '#9ca3af',
                    cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 700,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {pill.label}
                </button>
              )
            })}
          </div>

          {/* Divider */}
          <div style={{ width: '1px', height: '28px', background: '#1a1a1c', flexShrink: 0 }} />

          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={e => setStockFilter(e.target.value as StockFilter)}
            style={{
              padding: '0.45rem 0.8rem', borderRadius: '11px',
              border: '1px solid #202022', background: '#0c0c0d',
              color: '#9ca3af', fontSize: '0.8125rem', cursor: 'pointer',
              outline: 'none', fontWeight: 700,
            }}
          >
            {STOCK_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Active Toggle — TERTIARY meta filter, keeps the neutral dark
              treatment so it doesn't compete with the product filters above. */}
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {(['all', 'active', 'inactive'] as const).map(val => {
              const isActive = activeFilter === val
              return (
                <button
                  key={val}
                  className="pill-btn"
                  onClick={() => setActiveFilter(val)}
                  style={{
                    padding: '0.35rem 0.8rem', borderRadius: '999px',
                    border: '1px solid',
                    borderColor: isActive ? 'rgba(236,30,121,0.35)' : '#202022',
                    background: isActive ? 'rgba(236,30,121,0.12)' : 'transparent',
                    color: isActive ? '#FF80B8' : '#6b7280',
                    cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 700,
                    transition: 'all 0.15s ease', textTransform: 'capitalize',
                  }}
                >
                  {val}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Table ── */}
        <div style={{
          background: '#0f0f10', border: '1px solid #202022',
          borderRadius: '16px', overflow: 'hidden',
        }}>
          {/* Table Header
              Superadmin gets an extra "Vendor" column so they can see at a
              glance which member owns each product. Vendors don't need it
              (everything they see is their own). */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isSuper
              ? '48px 1fr 120px 100px 90px 90px 110px 52px 60px 96px'
              : '48px 1fr 120px 100px 90px 90px 52px 60px 96px',
            gap: '0.75rem', alignItems: 'center',
            padding: '0.75rem 1.35rem',
            borderBottom: '1px solid #1a1a1c',
            fontSize: '0.7rem', fontWeight: 700, color: '#6b7280',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            <span />
            <span>Product</span>
            <span>Category</span>
            <span>Price</span>
            <span>Stock</span>
            <span>Grade</span>
            {isSuper && <span>Vendor</span>}
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
                width: '44px', height: '44px', borderRadius: '999px',
                background: '#161617', border: '1px solid #202022',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Package size={20} color="#6b7280" />
              </div>
              <div>
                <p style={{ color: '#f4f4f5', fontWeight: 800, fontSize: '1rem', margin: 0 }}>No products found</p>
                <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: '0.4rem 0 0' }}>
                  {debouncedSearch || categoryFilter !== 'all' || stockFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Add your first product to get started'}
                </p>
              </div>
              {!debouncedSearch && categoryFilter === 'all' && stockFilter === 'all' && (
                <button
                  onClick={() => setEditProduct('new')}
                  style={{
                    marginTop: '0.5rem', padding: '0.6rem 1.1rem',
                    background: 'linear-gradient(135deg,#EC1E79,#FF4DA6)', color: '#fff', border: 'none',
                    borderRadius: '11px', cursor: 'pointer', fontWeight: 800,
                    fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem',
                    boxShadow: '0 8px 22px -10px rgba(236,30,121,0.6)',
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
                    gridTemplateColumns: isSuper
                      ? '48px 1fr 120px 100px 90px 90px 110px 52px 60px 96px'
                      : '48px 1fr 120px 100px 90px 90px 52px 60px 96px',
                    gap: '0.75rem', alignItems: 'center',
                    padding: '0.875rem 1.35rem',
                    borderBottom: '1px solid #1a1a1c',
                    transition: 'background 0.15s ease',
                    background: deleteId === product.id ? 'rgba(239,68,68,0.06)' : 'transparent',
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '11px',
                    background: '#161617', border: '1px solid #202022',
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
                    {!product.images?.[0] && <ImageIcon size={16} color="#6b7280" />}
                  </div>

                  {/* Name + tags */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontWeight: 700, fontSize: '0.875rem',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      color: product.active ? '#f4f4f5' : '#6b7280',
                    }}>
                      {product.name}
                    </div>
                    {product.tags.length > 0 && (
                      <div style={{
                        fontSize: '0.7rem', color: '#6b7280', marginTop: '0.2rem',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {product.tags.slice(0, 3).join(' · ')}
                      </div>
                    )}
                  </div>

                  {/* Category */}
                  {(() => {
                    const cat = CATEGORY_COLORS[product.category] ?? { bg: '#161617', color: '#9ca3af', label: product.category }
                    return (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center',
                        background: cat.bg, color: cat.color,
                        padding: '0.25rem 0.65rem', borderRadius: '999px',
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
                      <div style={{ fontSize: '0.7rem', color: '#6b7280', textDecoration: 'line-through' }}>
                        £{product.comparePrice.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    )}
                  </div>

                  {/* Stock Badge */}
                  <StockBadge stock={product.stock} />

                  {/* Vendor column — superadmin only */}
                  {/* Rendered between Grade and Star to keep the layout
                      readable. Shows initials chip + name. */}
                  {/* Grade */}
                  <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                    {product.grade ? (
                      <span style={{
                        background: 'rgba(129,140,248,0.1)', color: '#818cf8',
                        border: '1px solid rgba(129,140,248,0.25)',
                        padding: '0.2rem 0.5rem', borderRadius: '999px',
                        fontSize: '0.7rem', fontWeight: 700,
                      }}>
                        {product.grader} {product.grade}
                      </span>
                    ) : (
                      <span style={{ color: '#6b7280' }}>—</span>
                    )}
                  </div>

                  {/* Vendor cell — superadmin only */}
                  {isSuper && (
                    <div style={{ minWidth: 0, fontSize: '0.75rem', color: '#9ca3af' }}>
                      {product.vendor ? (
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                          background: product.vendorId === me?.id ? 'rgba(236,30,121,0.12)' : '#161617',
                          border: '1px solid', borderColor: product.vendorId === me?.id ? 'rgba(236,30,121,0.25)' : '#202022',
                          padding: '0.2rem 0.5rem', borderRadius: '999px',
                          color: product.vendorId === me?.id ? '#FF4DA6' : '#9ca3af',
                          fontWeight: 700,
                          maxWidth: '100%',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }} title={product.vendor.email}>
                          {product.vendor.name || product.vendor.email.split('@')[0]}
                        </div>
                      ) : (
                        <span style={{
                          fontSize: '0.65rem', color: '#6b7280',
                          background: '#161617', padding: '0.15rem 0.45rem', borderRadius: '999px',
                          border: '1px dashed #2a2a2c', fontWeight: 700,
                        }}>
                          Unassigned
                        </span>
                      )}
                    </div>
                  )}

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
                        color={product.featured ? '#f59e0b' : '#3a3a3c'}
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
                              background: '#ef4444', border: 'none', borderRadius: '8px',
                              padding: '5px 8px', cursor: 'pointer', color: '#fff',
                              fontSize: '0.7rem', fontWeight: 700,
                            }}
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setDeleteId(null)}
                            style={{
                              background: '#161617', border: '1px solid #202022',
                              borderRadius: '8px', padding: '5px 8px',
                              cursor: 'pointer', color: '#9ca3af',
                              fontSize: '0.7rem', fontWeight: 700,
                            }}
                          >
                            No
                          </button>
                        </motion.div>
                      </AnimatePresence>
                    ) : canEditOwned(product) ? (
                      <>
                        <button
                          className="edit-hover"
                          onClick={() => setEditProduct(product)}
                          style={{
                            background: '#161617',
                            border: '1px solid #202022',
                            borderRadius: '9px', padding: '6px',
                            cursor: 'pointer', display: 'flex',
                            color: '#9ca3af', transition: 'all 0.15s ease',
                          }}
                          title="Edit product"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDuplicate(product.id)}
                          style={{
                            background: 'rgba(236,30,121,0.1)',
                            border: '1px solid rgba(236,30,121,0.25)',
                            borderRadius: '9px', padding: '6px',
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
                            background: '#161617',
                            border: '1px solid #202022',
                            borderRadius: '9px', padding: '6px',
                            cursor: 'pointer', display: 'flex',
                            color: '#9ca3af', transition: 'all 0.15s ease',
                          }}
                          title="Delete product"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    ) : (
                      <span
                        title={`Owned by ${product.vendor?.name || product.vendor?.email || 'another vendor'} — only they can edit`}
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: '#6b7280',
                          background: '#161617',
                          border: '1px solid #202022',
                          borderRadius: '999px',
                          padding: '4px 10px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        View only
                      </span>
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
            <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
              Page {page} of {totalPages} · {total} products
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.6rem 1.1rem', borderRadius: '11px',
                  background: '#161617', border: '1px solid #202022',
                  color: page === 1 ? '#3a3a3c' : '#e4e4e7',
                  cursor: page === 1 ? 'default' : 'pointer',
                  fontSize: '0.85rem', fontWeight: 800,
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
                  padding: '0.6rem 1.1rem', borderRadius: '11px',
                  background: '#161617', border: '1px solid #202022',
                  color: page === totalPages ? '#3a3a3c' : '#e4e4e7',
                  cursor: page === totalPages ? 'default' : 'pointer',
                  fontSize: '0.85rem', fontWeight: 800,
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
