'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Package, Check, AlertCircle, X, Plus, Star, Eye } from 'lucide-react'
import { ImageUploader } from '@/components/admin/image-uploader'

// ─── Types ───────────────────────────────────────────────────────────────────

interface FormData {
  name: string
  game: 'pokemon' | 'one-piece'
  category: 'single' | 'graded' | 'booster' | 'sealed'
  price: string
  comparePrice: string
  stock: string
  description: string
  grade: string
  grader: 'PSA' | 'CGC' | 'ACE' | 'BGS'
  images: string[]
  tags: string
  featured: boolean
  active: boolean
}

interface FormErrors {
  name?: string
  price?: string
  stock?: string
  comparePrice?: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORY_OPTIONS = [
  { value: 'single', label: 'Single' },
  { value: 'graded', label: 'Graded' },
  { value: 'booster', label: 'Booster' },
  { value: 'sealed', label: 'Sealed' },
] as const

const GAME_OPTIONS = [
  { value: 'pokemon', label: 'Pokémon' },
  { value: 'one-piece', label: 'One Piece' },
] as const

const GRADER_OPTIONS = ['PSA', 'CGC', 'ACE', 'BGS'] as const

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  graded: { bg: 'rgba(129,140,248,0.15)', color: '#818cf8' },
  single: { bg: 'rgba(236,30,121,0.12)', color: '#EC1E79' },
  booster: { bg: 'rgba(245,158,11,0.13)', color: '#f59e0b' },
  sealed: { bg: 'rgba(52,211,153,0.12)', color: '#34d399' },
}

const INITIAL_FORM: FormData = {
  name: '',
  game: 'pokemon',
  category: 'single',
  price: '',
  comparePrice: '',
  stock: '',
  description: '',
  grade: '',
  grader: 'PSA',
  images: [],
  tags: '',
  featured: false,
  active: true,
}

// ─── Shared Styles ────────────────────────────────────────────────────────────

const inputBase: React.CSSProperties = {
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
  fontFamily: 'inherit',
}

const inputError: React.CSSProperties = {
  ...inputBase,
  border: '1px solid rgba(239,68,68,0.5)',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.72rem',
  fontWeight: 600,
  color: '#9ca3af',
  marginBottom: '0.35rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (val: boolean) => void
  label: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        style={{
          width: '40px',
          height: '22px',
          borderRadius: '11px',
          background: checked ? '#EC1E79' : '#2a2a2a',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background 0.2s ease',
          flexShrink: 0,
          padding: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: '3px',
            left: checked ? '21px' : '3px',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: '#fff',
            transition: 'left 0.2s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
          }}
        />
      </button>
      <span style={{ fontSize: '0.875rem', color: checked ? '#e5e7eb' : '#6b7280' }}>
        {label}
      </span>
    </div>
  )
}

// ─── Live Preview Card ────────────────────────────────────────────────────────

function PreviewCard({ form }: { form: FormData }) {
  const cat = CATEGORY_COLORS[form.category] ?? CATEGORY_COLORS.single
  const price = parseFloat(form.price) || 0
  const comparePrice = parseFloat(form.comparePrice) || 0
  const stock = parseInt(form.stock) || 0

  const stockStatus =
    stock === 0
      ? { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', label: 'Out of Stock' }
      : stock <= 2
      ? { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', label: `Low (${stock})` }
      : { bg: 'rgba(52,211,153,0.12)', color: '#34d399', label: `In Stock (${stock})` }

  const imageUrls = form.images

  const tagList = form.tags
    .split(',')
    .map(t => t.trim())
    .filter(Boolean)

  return (
    <div
      style={{
        background: '#111',
        border: '1px solid #1f1f1f',
        borderRadius: '14px',
        overflow: 'hidden',
      }}
    >
      {/* Image area */}
      <div
        style={{
          height: '200px',
          background: '#161616',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {imageUrls.length > 0 ? (
          <img
            src={imageUrls[0]}
            alt={form.name || 'Product'}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            onError={e => {
              ;(e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          <Package size={48} color="#2a2a2a" />
        )}
        {form.featured && (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'rgba(245,158,11,0.2)',
              border: '1px solid rgba(245,158,11,0.4)',
              borderRadius: '6px',
              padding: '0.25rem 0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              color: '#f59e0b',
              fontSize: '0.7rem',
              fontWeight: 700,
            }}
          >
            <Star size={10} fill="#f59e0b" />
            FEATURED
          </div>
        )}
        {!form.active && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              color: '#6b7280',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Inactive
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '1.25rem' }}>
        {/* Category badge */}
        <div style={{ marginBottom: '0.75rem' }}>
          <span
            style={{
              display: 'inline-block',
              background: cat.bg,
              color: cat.color,
              padding: '0.2rem 0.6rem',
              borderRadius: '6px',
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            {form.category}
          </span>
          {form.category === 'graded' && form.grade && (
            <span
              style={{
                marginLeft: '0.5rem',
                display: 'inline-block',
                background: 'rgba(129,140,248,0.1)',
                color: '#818cf8',
                padding: '0.2rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
              }}
            >
              {form.grader} {form.grade}
            </span>
          )}
        </div>

        {/* Name */}
        <h3
          style={{
            fontSize: '1rem',
            fontWeight: 700,
            color: form.name ? '#f9fafb' : '#374151',
            margin: '0 0 0.5rem',
            lineHeight: 1.4,
          }}
        >
          {form.name || 'Product Name'}
        </h3>

        {/* Description preview */}
        {form.description && (
          <p
            style={{
              fontSize: '0.8rem',
              color: '#6b7280',
              margin: '0 0 0.75rem',
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {form.description}
          </p>
        )}

        {/* Price */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <span
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: price > 0 ? '#EC1E79' : '#374151',
            }}
          >
            {price > 0 ? `£${price.toFixed(2)}` : '£—'}
          </span>
          {comparePrice > 0 && comparePrice > price && (
            <span
              style={{
                fontSize: '0.85rem',
                color: '#4b5563',
                textDecoration: 'line-through',
              }}
            >
              £{comparePrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Stock status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              background: stockStatus.bg,
              color: stockStatus.color,
              padding: '0.2rem 0.55rem',
              borderRadius: '6px',
              fontSize: '0.7rem',
              fontWeight: 700,
            }}
          >
            <span
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                background: stockStatus.color,
                display: 'inline-block',
              }}
            />
            {form.stock ? stockStatus.label : 'Stock TBD'}
          </span>
        </div>

        {/* Tags */}
        {tagList.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.75rem' }}>
            {tagList.slice(0, 4).map((tag, i) => (
              <span
                key={i}
                style={{
                  background: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  color: '#9ca3af',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.68rem',
                  fontWeight: 500,
                }}
              >
                {tag}
              </span>
            ))}
            {tagList.length > 4 && (
              <span style={{ color: '#4b5563', fontSize: '0.68rem', padding: '0.15rem 0' }}>
                +{tagList.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NewProductPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const set = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      setForm(prev => ({ ...prev, [key]: value }))
      if (errors[key as keyof FormErrors]) {
        setErrors(prev => ({ ...prev, [key]: undefined }))
      }
    },
    [errors]
  )

  const validate = (): boolean => {
    const next: FormErrors = {}
    if (!form.name.trim()) next.name = 'Product name is required'
    const price = parseFloat(form.price)
    if (!form.price || isNaN(price) || price < 0) next.price = 'Enter a valid price (£)'
    const stock = parseInt(form.stock)
    if (form.stock === '' || isNaN(stock) || stock < 0) next.stock = 'Enter a valid stock number'
    if (form.comparePrice) {
      const cp = parseFloat(form.comparePrice)
      if (isNaN(cp) || cp < 0) next.comparePrice = 'Enter a valid compare price (£)'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setSubmitError(null)

    const imageUrls = form.images

    const tagList = form.tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)

    const body: Record<string, unknown> = {
      name: form.name.trim(),
      game: form.game,
      category: form.category,
      price: parseFloat(form.price),
      stock: parseInt(form.stock),
      featured: form.featured,
      active: form.active,
    }

    if (form.description.trim()) body.description = form.description.trim()
    if (form.comparePrice) body.comparePrice = parseFloat(form.comparePrice)
    if (form.category === 'graded') {
      if (form.grade.trim()) body.grade = form.grade.trim()
      body.grader = form.grader
    }
    if (imageUrls.length > 0) body.images = imageUrls
    if (tagList.length > 0) body.tags = tagList

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || `Request failed (${res.status})`)
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/admin/products')
      }, 800)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff' }}>
      <style>{`
        input::placeholder, textarea::placeholder, select option {
          color: #4b5563;
        }
        select option {
          background: #161616;
          color: #fff;
        }
        input:focus, textarea:focus, select:focus {
          border-color: #EC1E79 !important;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div
        style={{
          borderBottom: '1px solid #111',
          padding: '1.25rem 2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          background: '#0a0a0a',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <button
          type="button"
          onClick={() => router.push('/admin/products')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'transparent',
            border: '1px solid #1f1f1f',
            borderRadius: '8px',
            color: '#9ca3af',
            cursor: 'pointer',
            padding: '0.45rem 0.875rem',
            fontSize: '0.8rem',
            fontWeight: 600,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => {
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#2a2a2a'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#e5e7eb'
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#1f1f1f'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#9ca3af'
          }}
        >
          <ArrowLeft size={14} />
          Back
        </button>

        <div>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f9fafb', margin: 0 }}>
            New Product
          </h1>
          <p style={{ fontSize: '0.75rem', color: '#4b5563', margin: 0 }}>
            Fill in the details below to create a new product listing
          </p>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <form onSubmit={handleSubmit} noValidate>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 340px',
              gap: '2rem',
              alignItems: 'start',
            }}
          >
            {/* ── Left column: form ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
            >
              {/* Submit error banner */}
              {submitError && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '0.875rem 1rem',
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: '10px',
                    animation: 'fadeIn 0.2s ease',
                  }}
                >
                  <AlertCircle size={16} color="#ef4444" style={{ marginTop: '1px', flexShrink: 0 }} />
                  <p style={{ fontSize: '0.85rem', color: '#fca5a5', margin: 0 }}>{submitError}</p>
                  <button
                    type="button"
                    onClick={() => setSubmitError(null)}
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', flexShrink: 0 }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Card: Basic Info */}
              <div
                style={{
                  background: '#111',
                  border: '1px solid #1a1a1a',
                  borderRadius: '14px',
                  padding: '1.5rem',
                }}
              >
                <h2
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#9ca3af',
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    margin: '0 0 1.25rem',
                  }}
                >
                  Basic Information
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Name */}
                  <div>
                    <label style={labelStyle}>
                      Product Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      style={errors.name ? inputError : inputBase}
                      value={form.name}
                      onChange={e => set('name', e.target.value)}
                      placeholder="e.g. Charizard ex Full Art"
                      autoFocus
                    />
                    {errors.name && (
                      <p style={{ fontSize: '0.73rem', color: '#f87171', marginTop: '0.35rem' }}>
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Game */}
                  <div>
                    <label style={labelStyle}>Game</label>
                    <select
                      style={{ ...inputBase, cursor: 'pointer', appearance: 'none' }}
                      value={form.game}
                      onChange={e => set('game', e.target.value as FormData['game'])}
                    >
                      {GAME_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Category */}
                  <div>
                    <label style={labelStyle}>Category</label>
                    <select
                      style={{ ...inputBase, cursor: 'pointer', appearance: 'none' }}
                      value={form.category}
                      onChange={e => set('category', e.target.value as FormData['category'])}
                    >
                      {CATEGORY_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label style={labelStyle}>Description</label>
                    <textarea
                      style={{
                        ...inputBase,
                        minHeight: '90px',
                        resize: 'vertical',
                        lineHeight: 1.6,
                      }}
                      value={form.description}
                      onChange={e => set('description', e.target.value)}
                      placeholder="Describe the product, condition, set, etc."
                    />
                  </div>
                </div>
              </div>

              {/* Card: Graded-only fields */}
              {form.category === 'graded' && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    background: 'rgba(129,140,248,0.05)',
                    border: '1px solid rgba(129,140,248,0.15)',
                    borderRadius: '14px',
                    padding: '1.5rem',
                  }}
                >
                  <h2
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: '#818cf8',
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                      margin: '0 0 1.25rem',
                    }}
                  >
                    Grading Details
                  </h2>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={labelStyle}>Grade</label>
                      <input
                        style={inputBase}
                        value={form.grade}
                        onChange={e => set('grade', e.target.value)}
                        placeholder="e.g. 9.5, PSA 10"
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Grader</label>
                      <select
                        style={{ ...inputBase, cursor: 'pointer', appearance: 'none' }}
                        value={form.grader}
                        onChange={e => set('grader', e.target.value as FormData['grader'])}
                      >
                        {GRADER_OPTIONS.map(g => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Card: Pricing & Stock */}
              <div
                style={{
                  background: '#111',
                  border: '1px solid #1a1a1a',
                  borderRadius: '14px',
                  padding: '1.5rem',
                }}
              >
                <h2
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#9ca3af',
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    margin: '0 0 1.25rem',
                  }}
                >
                  Pricing &amp; Stock
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  {/* Price */}
                  <div>
                    <label style={labelStyle}>
                      Price (£) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      style={errors.price ? inputError : inputBase}
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={e => set('price', e.target.value)}
                      placeholder="0.00"
                    />
                    {errors.price && (
                      <p style={{ fontSize: '0.73rem', color: '#f87171', marginTop: '0.35rem' }}>
                        {errors.price}
                      </p>
                    )}
                  </div>

                  {/* Compare Price */}
                  <div>
                    <label style={labelStyle}>Compare Price (£)</label>
                    <input
                      style={errors.comparePrice ? inputError : inputBase}
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.comparePrice}
                      onChange={e => set('comparePrice', e.target.value)}
                      placeholder="0.00"
                    />
                    {errors.comparePrice && (
                      <p style={{ fontSize: '0.73rem', color: '#f87171', marginTop: '0.35rem' }}>
                        {errors.comparePrice}
                      </p>
                    )}
                  </div>

                  {/* Stock */}
                  <div>
                    <label style={labelStyle}>
                      Stock <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      style={errors.stock ? inputError : inputBase}
                      type="number"
                      min="0"
                      step="1"
                      value={form.stock}
                      onChange={e => set('stock', e.target.value)}
                      placeholder="0"
                    />
                    {errors.stock && (
                      <p style={{ fontSize: '0.73rem', color: '#f87171', marginTop: '0.35rem' }}>
                        {errors.stock}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Card: Images & Tags */}
              <div
                style={{
                  background: '#111',
                  border: '1px solid #1a1a1a',
                  borderRadius: '14px',
                  padding: '1.5rem',
                }}
              >
                <h2
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#9ca3af',
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    margin: '0 0 1.25rem',
                  }}
                >
                  Media &amp; Tags
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <ImageUploader
                    images={form.images}
                    onChange={(imgs) => setForm(prev => ({ ...prev, images: imgs }))}
                    max={8}
                    label="Product Images"
                  />

                  <div>
                    <label style={labelStyle}>
                      Tags{' '}
                      <span style={{ color: '#4b5563', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                        — comma-separated
                      </span>
                    </label>
                    <input
                      style={inputBase}
                      value={form.tags}
                      onChange={e => set('tags', e.target.value)}
                      placeholder="pokemon, charizard, sv4, rare"
                    />
                  </div>
                </div>
              </div>

              {/* Card: Settings */}
              <div
                style={{
                  background: '#111',
                  border: '1px solid #1a1a1a',
                  borderRadius: '14px',
                  padding: '1.5rem',
                }}
              >
                <h2
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#9ca3af',
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    margin: '0 0 1.25rem',
                  }}
                >
                  Settings
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <ToggleSwitch
                    checked={form.active}
                    onChange={v => set('active', v)}
                    label="Active — visible to customers"
                  />
                  <ToggleSwitch
                    checked={form.featured}
                    onChange={v => set('featured', v)}
                    label="Featured — highlighted on homepage"
                  />
                </div>
              </div>

              {/* Submit row */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingBottom: '2rem' }}>
                <button
                  type="button"
                  onClick={() => router.push('/admin/products')}
                  style={{
                    padding: '0.7rem 1.5rem',
                    background: 'transparent',
                    border: '1px solid #1f1f1f',
                    borderRadius: '10px',
                    color: '#9ca3af',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#2a2a2a'
                    ;(e.currentTarget as HTMLButtonElement).style.color = '#e5e7eb'
                  }}
                  onMouseLeave={e => {
                    ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#1f1f1f'
                    ;(e.currentTarget as HTMLButtonElement).style.color = '#9ca3af'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting || success}
                  style={{
                    padding: '0.7rem 1.75rem',
                    background: success
                      ? 'rgba(52,211,153,0.15)'
                      : submitting
                      ? 'rgba(236,30,121,0.5)'
                      : '#EC1E79',
                    border: success
                      ? '1px solid rgba(52,211,153,0.3)'
                      : '1px solid transparent',
                    borderRadius: '10px',
                    color: success ? '#34d399' : '#000',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    cursor: submitting || success ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease',
                    minWidth: '160px',
                    justifyContent: 'center',
                  }}
                >
                  {success ? (
                    <>
                      <Check size={16} />
                      Created!
                    </>
                  ) : submitting ? (
                    <>
                      <span
                        style={{
                          width: '14px',
                          height: '14px',
                          border: '2px solid rgba(0,0,0,0.3)',
                          borderTopColor: '#000',
                          borderRadius: '50%',
                          animation: 'spin 0.7s linear infinite',
                          display: 'inline-block',
                        }}
                      />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Create Product
                    </>
                  )}
                </button>
              </div>
            </motion.div>

            {/* ── Right column: preview ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              style={{ position: 'sticky', top: '80px' }}
            >
              <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Eye size={14} color="#4b5563" />
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#4b5563',
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                  }}
                >
                  Live Preview
                </span>
              </div>
              <PreviewCard form={form} />

              {/* Hint text */}
              <p
                style={{
                  fontSize: '0.72rem',
                  color: '#374151',
                  marginTop: '0.75rem',
                  textAlign: 'center',
                  lineHeight: 1.5,
                }}
              >
                Preview updates as you type.
                <br />
                Actual listing may differ slightly.
              </p>
            </motion.div>
          </div>
        </form>
      </div>
    </div>
  )
}
