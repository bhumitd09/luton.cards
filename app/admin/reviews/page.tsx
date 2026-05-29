'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useConfirm } from '@/components/admin/confirm-dialog'
import { useToast } from '@/components/admin/toast'

interface Review {
  id: string
  name: string
  location: string | null
  rating: number
  body: string
  productRef: string | null
  approved: boolean
  featured: boolean
  createdAt: string
}

type Filter = 'all' | 'pending' | 'approved' | 'featured'

function StarRating({ rating, interactive = false, onRate }: {
  rating: number
  interactive?: boolean
  onRate?: (r: number) => void
}) {
  const [hovered, setHovered] = useState(0)
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          onClick={() => interactive && onRate && onRate(n)}
          onMouseEnter={() => interactive && setHovered(n)}
          onMouseLeave={() => interactive && setHovered(0)}
          style={{
            fontSize: interactive ? '1.5rem' : '0.9rem',
            cursor: interactive ? 'pointer' : 'default',
            color: n <= (hovered || rating) ? '#EC1E79' : '#2a2a2c',
            lineHeight: 1,
          }}
        >
          ★
        </span>
      ))}
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div style={{
      background: '#0f0f10',
      border: '1px solid #202022',
      borderRadius: '16px',
      padding: '1.25rem 1.35rem',
      flex: 1,
    }}>
      <div style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.02em', color: accent ? '#EC1E79' : '#f4f4f5' }}>
        {value}
      </div>
      <div style={{ fontSize: '0.8125rem', color: '#9ca3af', marginTop: '0.25rem' }}>{label}</div>
    </div>
  )
}

const emptyForm = {
  name: '',
  location: '',
  rating: 5,
  body: '',
  productRef: '',
  approved: false,
  featured: false,
}

export default function ReviewsAdminPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const confirm = useConfirm()
  const toast = useToast()

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/reviews')
      const data = await res.json()
      setReviews(data.reviews ?? [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [])

  const openAdd = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowAddForm(true)
  }

  const openEdit = (review: Review) => {
    setEditingId(review.id)
    setForm({
      name: review.name,
      location: review.location ?? '',
      rating: review.rating,
      body: review.body,
      productRef: review.productRef ?? '',
      approved: review.approved,
      featured: review.featured,
    })
    setShowAddForm(true)
  }

  const closeForm = () => {
    setShowAddForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        location: form.location || null,
        rating: form.rating,
        body: form.body,
        productRef: form.productRef || null,
        approved: form.approved,
        featured: form.featured,
      }

      let res: Response
      if (editingId) {
        res = await fetch(`/api/admin/reviews/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch('/api/admin/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      await fetchReviews()
      closeForm()
      if (res.ok) {
        toast.success('Updated')
      } else {
        toast.error('Could not save review')
      }
    } catch {
      toast.error('Could not save review')
    } finally {
      setSaving(false)
    }
  }

  const toggleApproved = async (review: Review) => {
    const res = await fetch(`/api/admin/reviews/${review.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved: !review.approved }),
    })
    await fetchReviews()
    if (res.ok) {
      toast.success('Updated')
    } else {
      toast.error('Could not update review')
    }
  }

  const toggleFeatured = async (review: Review) => {
    const res = await fetch(`/api/admin/reviews/${review.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featured: !review.featured }),
    })
    await fetchReviews()
    if (res.ok) {
      toast.success('Updated')
    } else {
      toast.error('Could not update review')
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      message: 'Delete this review? This cannot be undone.',
      confirmLabel: 'Delete',
      danger: true,
    })
    if (!ok) return
    const res = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' })
    await fetchReviews()
    if (res.ok) {
      toast.success('Deleted')
    } else {
      toast.error('Could not delete')
    }
  }

  const total = reviews.length
  const approved = reviews.filter(r => r.approved).length
  const pending = reviews.filter(r => !r.approved).length

  const filtered = reviews.filter(r => {
    if (filter === 'pending') return !r.approved
    if (filter === 'approved') return r.approved
    if (filter === 'featured') return r.featured
    return true
  })

  const emptyMessages: Record<Filter, string> = {
    all: 'No reviews yet. Add one using the button above.',
    pending: 'No pending reviews.',
    approved: 'No approved reviews.',
    featured: 'No featured reviews.',
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '960px', margin: '0 auto', background: '#0a0a0a' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '1.75rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: '#EC1E79',
            fontSize: '10px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.16em',
            marginBottom: '0.5rem',
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <path d="M12 2l2.9 6.1 6.6.9-4.8 4.7 1.1 6.6L12 18.1 6.2 20.3l1.1-6.6L2.5 9l6.6-.9L12 2z" />
            </svg>
            Moderation
          </div>
          <h1 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.75rem)', fontWeight: 900, letterSpacing: '-0.025em', color: '#fff', margin: 0 }}>
            Reviews &amp; Testimonials
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: '0.4rem 0 0' }}>
            Manage customer reviews and testimonials
          </p>
        </div>
        <button
          onClick={openAdd}
          style={{
            background: 'linear-gradient(135deg,#EC1E79 0%,#FF4DA6 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '11px',
            padding: '0.6rem 1.1rem',
            fontSize: '0.85rem',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 8px 22px -10px rgba(236,30,121,0.6)',
          }}
        >
          + Add review
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatCard label="Total Reviews" value={total} />
        <StatCard label="Approved" value={approved} accent />
        <StatCard label="Pending Approval" value={pending} />
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {(['all', 'pending', 'approved', 'featured'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '0.375rem 1rem',
              borderRadius: '999px',
              border: filter === f ? '1px solid #EC1E79' : '1px solid #202022',
              background: filter === f ? 'rgba(236,30,121,0.12)' : '#0f0f10',
              color: filter === f ? '#EC1E79' : '#9ca3af',
              fontSize: '0.8125rem',
              fontWeight: 700,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Review list */}
      {loading ? (
        <div style={{ color: '#9ca3af', padding: '3rem', textAlign: 'center' }}>Loading reviews…</div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: '#0f0f10',
          border: '1px solid #202022',
          borderRadius: '16px',
          padding: '4rem 3rem',
          textAlign: 'center',
        }}>
          <div style={{
            width: '44px', height: '44px',
            background: '#161617',
            border: '1px solid #202022',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            color: '#6b7280',
            fontSize: '1.1rem',
          }}>
            ★
          </div>
          <p style={{ color: '#f4f4f5', fontWeight: 700, margin: 0 }}>{emptyMessages[filter]}</p>
          <p style={{ color: '#9ca3af', fontSize: '0.8125rem', marginTop: '0.35rem' }}>
            Reviews you add or moderate will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {filtered.map(review => (
            <motion.div
              key={review.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: '#0f0f10',
                border: '1px solid #202022',
                borderRadius: '16px',
                padding: '1.25rem 1.35rem',
              }}
            >
              {/* Top row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <StarRating rating={review.rating} />
                  <div>
                    <span style={{ color: '#f4f4f5', fontWeight: 700, fontSize: '0.9375rem' }}>{review.name}</span>
                    {review.location && (
                      <span style={{ color: '#9ca3af', fontSize: '0.8125rem', marginLeft: '0.5rem' }}>
                        {review.location}
                      </span>
                    )}
                  </div>
                </div>
                <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                  {new Date(review.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>

              {/* Body */}
              <p style={{
                color: '#d4d4d8',
                fontSize: '0.9rem',
                fontStyle: 'italic',
                lineHeight: 1.65,
                margin: '0 0 0.75rem',
              }}>
                &ldquo;{review.body}&rdquo;
              </p>

              {/* Product ref chip */}
              {review.productRef && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <span style={{
                    background: '#161617',
                    color: '#9ca3af',
                    fontSize: '0.75rem',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '999px',
                    border: '1px solid #202022',
                  }}>
                    {review.productRef}
                  </span>
                </div>
              )}

              {/* Bottom row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '999px',
                    background: review.approved ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                    color: review.approved ? '#10b981' : '#f59e0b',
                    border: review.approved ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(245,158,11,0.25)',
                  }}>
                    {review.approved ? 'Approved' : 'Pending'}
                  </span>
                  {review.featured && (
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.6rem',
                      borderRadius: '999px',
                      background: 'rgba(236,30,121,0.12)',
                      color: '#EC1E79',
                      border: '1px solid rgba(236,30,121,0.25)',
                    }}>
                      Featured
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {/* Approve/Unapprove */}
                  <button
                    onClick={() => toggleApproved(review)}
                    title={review.approved ? 'Unapprove' : 'Approve'}
                    style={{
                      background: review.approved ? 'rgba(16,185,129,0.1)' : '#161617',
                      border: review.approved ? '1px solid rgba(16,185,129,0.25)' : '1px solid #202022',
                      borderRadius: '11px',
                      padding: '0.4rem 0.6rem',
                      cursor: 'pointer',
                      color: review.approved ? '#10b981' : '#9ca3af',
                      fontSize: '0.875rem',
                      lineHeight: 1,
                    }}
                  >
                    ✓
                  </button>
                  {/* Feature/unfeature */}
                  <button
                    onClick={() => toggleFeatured(review)}
                    title={review.featured ? 'Unfeature' : 'Feature'}
                    style={{
                      background: review.featured ? 'rgba(236,30,121,0.12)' : '#161617',
                      border: review.featured ? '1px solid rgba(236,30,121,0.25)' : '1px solid #202022',
                      borderRadius: '11px',
                      padding: '0.4rem 0.6rem',
                      cursor: 'pointer',
                      color: review.featured ? '#EC1E79' : '#9ca3af',
                      fontSize: '0.875rem',
                      lineHeight: 1,
                    }}
                  >
                    ★
                  </button>
                  {/* Edit */}
                  <button
                    onClick={() => openEdit(review)}
                    title="Edit"
                    style={{
                      background: '#161617',
                      border: '1px solid #202022',
                      borderRadius: '11px',
                      padding: '0.4rem 0.6rem',
                      cursor: 'pointer',
                      color: '#e4e4e7',
                      fontSize: '0.875rem',
                      lineHeight: 1,
                    }}
                  >
                    ✎
                  </button>
                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(review.id)}
                    title="Delete"
                    style={{
                      background: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.25)',
                      borderRadius: '11px',
                      padding: '0.4rem 0.6rem',
                      cursor: 'pointer',
                      color: '#ef4444',
                      fontSize: '0.875rem',
                      lineHeight: 1,
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Slide-over form */}
      <AnimatePresence>
        {showAddForm && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeForm}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.6)',
                zIndex: 40,
              }}
            />

            {/* Panel */}
            <motion.div
              key="panel"
              role="dialog"
              aria-modal="true"
              initial={{ x: 440 }}
              animate={{ x: 0 }}
              exit={{ x: 440 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                width: '420px',
                background: '#0f0f10',
                borderLeft: '1px solid #202022',
                zIndex: 50,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Panel header */}
              <div style={{
                padding: '1.25rem 1.35rem',
                borderBottom: '1px solid #1a1a1c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}>
                <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#fff' }}>
                  {editingId ? 'Edit review' : 'Add review'}
                </h2>
                <button
                  onClick={closeForm}
                  aria-label="Close"
                  style={{
                    background: '#161617',
                    border: '1px solid #202022',
                    color: '#9ca3af',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    lineHeight: 1,
                    borderRadius: '9px',
                    padding: '0.35rem 0.5rem',
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
                {/* Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Alex Johnson"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      background: '#0c0c0d',
                      border: '1px solid #202022',
                      borderRadius: '11px',
                      padding: '0.6rem 0.8rem',
                      color: '#fff',
                      fontSize: '0.875rem',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Location */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Location
                  </label>
                  <input
                    value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="e.g. London, UK"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      background: '#0c0c0d',
                      border: '1px solid #202022',
                      borderRadius: '11px',
                      padding: '0.6rem 0.8rem',
                      color: '#fff',
                      fontSize: '0.875rem',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Rating */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Rating
                  </label>
                  <StarRating
                    rating={form.rating}
                    interactive
                    onRate={r => setForm(f => ({ ...f, rating: r }))}
                  />
                </div>

                {/* Review body */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Review <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <textarea
                    required
                    value={form.body}
                    onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                    placeholder="Write the review text here…"
                    rows={5}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      background: '#0c0c0d',
                      border: '1px solid #202022',
                      borderRadius: '11px',
                      padding: '0.6rem 0.8rem',
                      color: '#fff',
                      fontSize: '0.875rem',
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                {/* Product ref */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Product Reference
                  </label>
                  <input
                    value={form.productRef}
                    onChange={e => setForm(f => ({ ...f, productRef: e.target.value }))}
                    placeholder="e.g. Charizard PSA 10"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      background: '#0c0c0d',
                      border: '1px solid #202022',
                      borderRadius: '11px',
                      padding: '0.6rem 0.8rem',
                      color: '#fff',
                      fontSize: '0.875rem',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Toggles */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[
                    { key: 'approved' as const, label: 'Approved' },
                    { key: 'featured' as const, label: 'Featured' },
                  ].map(({ key, label }) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                      <div
                        onClick={() => setForm(f => ({ ...f, [key]: !f[key] }))}
                        style={{
                          width: '40px',
                          height: '22px',
                          borderRadius: '999px',
                          background: form[key] ? '#EC1E79' : '#2a2a2c',
                          position: 'relative',
                          transition: 'background 0.2s',
                          flexShrink: 0,
                        }}
                      >
                        <div style={{
                          position: 'absolute',
                          top: '3px',
                          left: form[key] ? '21px' : '3px',
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          background: '#fff',
                          transition: 'left 0.2s',
                        }} />
                      </div>
                      <span style={{ color: '#e4e4e7', fontSize: '0.875rem', fontWeight: 600 }}>{label}</span>
                    </label>
                  ))}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    background: 'linear-gradient(135deg,#EC1E79,#FF4DA6)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '11px',
                    padding: '0.7rem',
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.7 : 1,
                    marginTop: '0.5rem',
                    boxShadow: '0 8px 22px -10px rgba(236,30,121,0.6)',
                  }}
                >
                  {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Review'}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
