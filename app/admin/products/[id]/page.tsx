'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Save, Trash2, AlertTriangle, Check,
  Tag, X, Package,
} from 'lucide-react'
import Link from 'next/link'
import { ImageUploader } from '@/components/admin/image-uploader'

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Shared Styles ────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.7rem 0.9rem',
  background: '#161616',
  border: '1px solid #1f1f1f',
  borderRadius: '9px',
  color: '#fff',
  fontSize: '0.875rem',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s ease',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.73rem',
  fontWeight: 700,
  color: '#9ca3af',
  marginBottom: '0.4rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const sectionStyle: React.CSSProperties = {
  background: '#111',
  border: '1px solid #1f1f1f',
  borderRadius: '14px',
  padding: '1.5rem',
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: () => void
  label: string
  description: string
}) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: '1rem',
      cursor: 'pointer', padding: '0.875rem 1rem',
      background: '#161616', borderRadius: '10px',
      border: `1px solid ${checked ? 'rgba(236,30,121,0.2)' : '#1f1f1f'}`,
      transition: 'border-color 0.2s ease',
    }}>
      <button
        type="button"
        onClick={onChange}
        style={{
          width: '42px', height: '24px', borderRadius: '12px',
          background: checked ? '#EC1E79' : '#2a2a2a',
          border: 'none', cursor: 'pointer', position: 'relative',
          transition: 'background 0.2s ease', flexShrink: 0, padding: 0,
        }}
      >
        <span style={{
          position: 'absolute', top: '4px',
          left: checked ? '22px' : '4px',
          width: '16px', height: '16px', borderRadius: '50%',
          background: '#fff', transition: 'left 0.2s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
        }} />
      </button>
      <div>
        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: checked ? '#fff' : '#9ca3af' }}>
          {label}
        </div>
        <div style={{ fontSize: '0.8rem', color: '#4b5563', marginTop: '0.1rem' }}>
          {description}
        </div>
      </div>
    </label>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductEditPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params?.id as string

  const [product, setProduct] = useState<Product | null>(null)
  // Ownership flag from the API. False when viewing another vendor's product
  // as superadmin — locks the form and hides save/delete buttons.
  const [canEdit, setCanEdit] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [fetchError, setFetchError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saved, setSaved] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [game, setGame] = useState<'pokemon' | 'one-piece'>('pokemon')
  const [category, setCategory] = useState('single')
  const [price, setPrice] = useState('')
  const [comparePrice, setComparePrice] = useState('')
  const [stock, setStock] = useState('')
  const [grade, setGrade] = useState('')
  const [grader, setGrader] = useState('PSA')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [featured, setFeatured] = useState(false)
  const [active, setActive] = useState(true)
  const [images, setImages] = useState<string[]>([])

  useEffect(() => {
    if (!productId) return
    setLoading(true)
    setFetchError('')
    fetch(`/api/admin/products/${productId}`)
      .then(async res => {
        if (!res.ok) {
          if (res.status === 403) throw new Error('You do not have access to this product.')
          throw new Error(res.status === 404 ? 'Product not found' : 'Failed to load product')
        }
        return res.json()
      })
      .then((payload: { product: Product; canEdit?: boolean } | Product) => {
        // API now returns { product, canEdit }. Tolerate the legacy bare-object
        // shape too in case something stale hits this code path.
        const data: Product =
          (payload as { product?: Product })?.product ?? (payload as Product)
        const editable = (payload as { canEdit?: boolean })?.canEdit
        setProduct(data)
        if (typeof editable === 'boolean') setCanEdit(editable)
        setName(data.name)
        setGame((data.game === 'one-piece' ? 'one-piece' : 'pokemon'))
        setCategory(data.category)
        setPrice(String(data.price))
        setComparePrice(data.comparePrice != null ? String(data.comparePrice) : '')
        setStock(String(data.stock))
        setGrade(data.grade ?? '')
        setGrader(data.grader ?? 'PSA')
        setDescription(data.description ?? '')
        setTags(data.tags.join(', '))
        setFeatured(data.featured)
        setActive(data.active)
        setImages(data.images)
      })
      .catch(err => setFetchError(err.message))
      .finally(() => setLoading(false))
  }, [productId])

  const handleSave = async () => {
    if (!name.trim() || !price || !stock) {
      setSaveError('Name, price and stock are required.')
      return
    }
    setSaving(true)
    setSaveError('')
    setSaved(false)
    try {
      const body = {
        name: name.trim(),
        game,
        category,
        price: Number(price),
        comparePrice: comparePrice ? Number(comparePrice) : null,
        stock: Number(stock),
        grade: category === 'graded' ? grade || null : null,
        grader: category === 'graded' ? grader || null : null,
        description: description || null,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        featured,
        active,
        images,
      }
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Save failed')
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save product.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/products/${productId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      router.push('/admin/products')
    } catch {
      setSaveError('Failed to delete product.')
      setConfirmDelete(false)
      setDeleting(false)
    }
  }

  // ── Loading State ──
  if (loading) {
    return (
      <div style={{ padding: '2.5rem 2.25rem', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ width: '80px', height: '20px', background: '#161616', borderRadius: '6px', animation: 'shimmer 1.4s infinite' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: '14px', padding: '1.5rem', height: '140px' }} />
            ))}
          </div>
          <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: '14px', padding: '1.5rem', height: '300px' }} />
        </div>
        <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
      </div>
    )
  }

  // ── Error State ──
  if (fetchError) {
    return (
      <div style={{ padding: '2.5rem 2.25rem', color: '#fff' }}>
        <Link href="/admin/products" style={{ textDecoration: 'none' }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: '#111', border: '1px solid #1f1f1f', borderRadius: '9px',
            padding: '0.6rem 1rem', color: '#9ca3af', cursor: 'pointer',
            fontSize: '0.875rem', marginBottom: '2rem',
          }}>
            <ArrowLeft size={15} /> Back to Products
          </button>
        </Link>
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: '14px', padding: '2rem', textAlign: 'center', color: '#fca5a5',
        }}>
          <Package size={32} color="#ef4444" style={{ margin: '0 auto 1rem', display: 'block' }} />
          <p style={{ fontWeight: 600, fontSize: '1rem', margin: 0 }}>{fetchError}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus, select:focus, textarea:focus { border-color: #2f2f2f !important; }
      `}</style>

      <div style={{ padding: '2rem 2.25rem', color: '#fff', minHeight: '100vh' }}>

        {/* ── Breadcrumb / Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link href="/admin/products" style={{ textDecoration: 'none' }}>
              <button style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: '#111', border: '1px solid #1f1f1f', borderRadius: '9px',
                padding: '0.6rem 1rem', color: '#9ca3af', cursor: 'pointer',
                fontSize: '0.875rem', fontWeight: 600,
                transition: 'all 0.15s ease',
              }}>
                <ArrowLeft size={15} /> Products
              </button>
            </Link>
            <span style={{ color: '#2a2a2a' }}>/</span>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>
              {product?.name ?? 'Edit Product'}
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {/* Save status */}
            <AnimatePresence>
              {saved && (
                <motion.span
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    color: '#EC1E79', fontSize: '0.875rem', fontWeight: 600,
                  }}
                >
                  <Check size={15} /> Saved
                </motion.span>
              )}
            </AnimatePresence>

            {/* Read-only badge — superadmin viewing another vendor's product */}
            {!canEdit && (
              <span style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.45rem 0.85rem', borderRadius: '9px',
                background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
                color: '#f59e0b', fontSize: '0.78rem', fontWeight: 700,
                letterSpacing: '0.02em',
              }}
              title="Only the owning vendor can edit this product">
                View only
              </span>
            )}

            {canEdit && (
              <button
                onClick={() => setConfirmDelete(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.65rem 1.1rem', borderRadius: '9px',
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                  color: '#ef4444', cursor: 'pointer', fontWeight: 600,
                  fontSize: '0.875rem', transition: 'all 0.15s ease',
                }}
              >
                <Trash2 size={14} /> Delete
              </button>
            )}

            {canEdit && <motion.button
              onClick={handleSave}
              disabled={saving}
              whileHover={{ scale: saving ? 1 : 1.02 }}
              whileTap={{ scale: saving ? 1 : 0.97 }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.65rem 1.4rem', borderRadius: '9px',
                background: saving ? '#00a885' : '#EC1E79',
                border: 'none', color: '#000', fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem', boxShadow: '0 4px 14px rgba(236,30,121,0.2)',
                transition: 'background 0.15s ease',
              }}
            >
              {saving ? (
                <>
                  <span style={{
                    width: '13px', height: '13px', border: '2px solid rgba(0,0,0,0.3)',
                    borderTopColor: '#000', borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite', display: 'inline-block',
                  }} />
                  Saving...
                </>
              ) : (
                <><Save size={14} /> Save Changes</>
              )}
            </motion.button>}
          </div>
        </div>

        {/* ── Error Banner ── */}
        <AnimatePresence>
          {saveError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '12px', padding: '0.875rem 1rem', marginBottom: '1.5rem',
                color: '#fca5a5', fontSize: '0.875rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={15} /> {saveError}
              </div>
              <button onClick={() => setSaveError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Two-column Layout ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>

          {/* ── Left Column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Basic Info */}
            <div style={sectionStyle}>
              <h3 style={{ fontWeight: 700, fontSize: '0.9rem', color: '#9ca3af', margin: '0 0 1.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Basic Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={labelStyle}>Product Name *</label>
                  <input
                    style={inputStyle} value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Charizard VMAX Rainbow Rare"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Game *</label>
                  <select
                    style={{ ...inputStyle, cursor: 'pointer' }}
                    value={game}
                    onChange={e => setGame(e.target.value as 'pokemon' | 'one-piece')}
                  >
                    <option value="pokemon">Pokémon</option>
                    <option value="one-piece">One Piece</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Category *</label>
                  <select
                    style={{ ...inputStyle, cursor: 'pointer' }}
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                  >
                    <option value="single">Single</option>
                    <option value="graded">Graded</option>
                    <option value="booster">Booster</option>
                    <option value="sealed">Sealed</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Stock *</label>
                  <input
                    style={inputStyle} type="number" min="0"
                    value={stock} onChange={e => setStock(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={labelStyle}>Description</label>
                  <textarea
                    style={{ ...inputStyle, resize: 'vertical', minHeight: '100px' }}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Describe the product..."
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div style={sectionStyle}>
              <h3 style={{ fontWeight: 700, fontSize: '0.9rem', color: '#9ca3af', margin: '0 0 1.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Pricing
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Price (£) *</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute', left: '12px', top: '50%',
                      transform: 'translateY(-50%)', color: '#4b5563',
                      fontSize: '0.875rem', fontWeight: 600, pointerEvents: 'none',
                    }}>£</span>
                    <input
                      style={{ ...inputStyle, paddingLeft: '1.75rem' }}
                      type="number" min="0" step="0.01"
                      value={price} onChange={e => setPrice(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Compare Price (£) <span style={{ color: '#4b5563', textTransform: 'none', letterSpacing: 0 }}>— optional</span></label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute', left: '12px', top: '50%',
                      transform: 'translateY(-50%)', color: '#4b5563',
                      fontSize: '0.875rem', fontWeight: 600, pointerEvents: 'none',
                    }}>£</span>
                    <input
                      style={{ ...inputStyle, paddingLeft: '1.75rem' }}
                      type="number" min="0" step="0.01"
                      value={comparePrice} onChange={e => setComparePrice(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Grading (conditional) */}
            <AnimatePresence>
              {category === 'graded' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={sectionStyle}>
                    <h3 style={{ fontWeight: 700, fontSize: '0.9rem', color: '#818cf8', margin: '0 0 1.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Grading Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={labelStyle}>Grade</label>
                        <input
                          style={inputStyle} value={grade}
                          onChange={e => setGrade(e.target.value)}
                          placeholder="e.g. PSA 10"
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Grader</label>
                        <select
                          style={{ ...inputStyle, cursor: 'pointer' }}
                          value={grader}
                          onChange={e => setGrader(e.target.value)}
                        >
                          <option value="PSA">PSA</option>
                          <option value="CGC">CGC</option>
                          <option value="ACE">ACE</option>
                          <option value="BGS">BGS</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tags */}
            <div style={sectionStyle}>
              <h3 style={{ fontWeight: 700, fontSize: '0.9rem', color: '#9ca3af', margin: '0 0 1.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Tags
              </h3>
              <div style={{ position: 'relative' }}>
                <Tag size={14} color="#4b5563" style={{
                  position: 'absolute', left: '12px', top: '50%',
                  transform: 'translateY(-50%)', pointerEvents: 'none',
                }} />
                <input
                  style={{ ...inputStyle, paddingLeft: '2.2rem' }}
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  placeholder="charizard, holo, rare, ex"
                />
              </div>
              <p style={{ color: '#4b5563', fontSize: '0.8rem', margin: '0.5rem 0 0' }}>
                Separate tags with commas
              </p>
            </div>

            {/* Images */}
            <div style={sectionStyle}>
              <ImageUploader
                images={images}
                onChange={setImages}
                max={8}
                label="Product Images"
              />
            </div>
          </div>

          {/* ── Right Column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'sticky', top: '1.5rem' }}>

            {/* Status */}
            <div style={sectionStyle}>
              <h3 style={{ fontWeight: 700, fontSize: '0.9rem', color: '#9ca3af', margin: '0 0 1.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Visibility
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <ToggleSwitch
                  checked={active}
                  onChange={() => setActive(a => !a)}
                  label="Active"
                  description="Visible in the shop"
                />
                <ToggleSwitch
                  checked={featured}
                  onChange={() => setFeatured(f => !f)}
                  label="Featured"
                  description="Shown on the homepage"
                />
              </div>
            </div>

            {/* Product Meta */}
            {product && (
              <div style={sectionStyle}>
                <h3 style={{ fontWeight: 700, fontSize: '0.9rem', color: '#9ca3af', margin: '0 0 1.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Metadata
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[
                    { label: 'ID', value: product.id.slice(0, 14) + '...' },
                    { label: 'Slug', value: product.slug },
                    { label: 'Created', value: new Date(product.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) },
                    { label: 'Updated', value: new Date(product.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'baseline' }}>
                      <span style={{ fontSize: '0.8rem', color: '#4b5563', flexShrink: 0 }}>{label}</span>
                      <span style={{ fontSize: '0.8rem', color: '#9ca3af', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Save — hidden when product is read-only for current user */}
            {canEdit && <motion.button
              onClick={handleSave}
              disabled={saving}
              whileHover={{ scale: saving ? 1 : 1.02 }}
              whileTap={{ scale: saving ? 1 : 0.97 }}
              style={{
                width: '100%', padding: '0.85rem',
                background: saving ? '#00a885' : '#EC1E79',
                border: 'none', borderRadius: '12px',
                color: '#000', fontWeight: 700, fontSize: '0.95rem',
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                boxShadow: '0 4px 20px rgba(236,30,121,0.2)',
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
                <><Save size={16} /> Save Changes</>
              )}
            </motion.button>}
          </div>
        </div>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      <AnimatePresence>
        {confirmDelete && (
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 200,
              background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '1rem',
            }}
            onClick={() => setConfirmDelete(false)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: '#111', border: '1px solid #1f1f1f', borderRadius: '20px',
                padding: '2rem', maxWidth: '380px', width: '100%', color: '#fff',
                textAlign: 'center', boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
              }}
            >
              <div style={{
                width: '52px', height: '52px', borderRadius: '14px',
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}>
                <Trash2 size={22} color="#ef4444" />
              </div>
              <h3 style={{ fontWeight: 800, fontSize: '1.125rem', margin: '0 0 0.5rem' }}>Delete Product?</h3>
              <p style={{ color: '#9ca3af', fontSize: '0.9rem', margin: '0 0 1.75rem', lineHeight: 1.5 }}>
                <strong style={{ color: '#fff' }}>{product?.name}</strong> will be permanently deleted.
                This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => setConfirmDelete(false)}
                  style={{
                    flex: 1, padding: '0.75rem', borderRadius: '10px',
                    background: '#1a1a1a', border: '1px solid #2a2a2a',
                    color: '#9ca3af', fontWeight: 600, cursor: 'pointer',
                    fontSize: '0.9rem',
                  }}
                >
                  Cancel
                </button>
                <motion.button
                  onClick={handleDelete}
                  disabled={deleting}
                  whileHover={{ scale: deleting ? 1 : 1.02 }}
                  whileTap={{ scale: deleting ? 1 : 0.97 }}
                  style={{
                    flex: 1, padding: '0.75rem', borderRadius: '10px',
                    background: '#ef4444', border: 'none', color: '#fff',
                    fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '0.4rem',
                    opacity: deleting ? 0.7 : 1,
                  }}
                >
                  {deleting ? 'Deleting...' : <><Trash2 size={15} /> Delete</>}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
