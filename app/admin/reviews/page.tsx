'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

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
            color: n <= (hovered || rating) ? '#EC1E79' : '#374151',
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
      background: '#111',
      border: '1px solid #1f1f1f',
      borderRadius: '12px',
      padding: '1.25rem 1.5rem',
      flex: 1,
    }}>
      <div style={{ fontSize: '1.75rem', fontWeight: 700, color: accent ? '#EC1E79' : '#fff' }}>
        {value}
      </div>
      <div style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '0.25rem' }}>{label}</div>
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

      if (editingId) {
        await fetch(`/api/admin/reviews/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        await fetch('/api/admin/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      await fetchReviews()
      closeForm()
    } catch {
      // silent
    } finally {
      setSaving(false)
    }
  }

  const toggleApproved = async (review: Review) => {
    await fetch(`/api/admin/reviews/${review.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved: !review.approved }),
    })
    await fetchReviews()
  }

  const toggleFeatured = async (review: Review) => {
    await fetch(`/api/admin/reviews/${review.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featured: !review.featured }),
    })
    await fetchReviews()
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this review? This cannot be undone.')) return
    await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' })
    await fetchReviews()
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
    <div style={{ padding: '2rem', maxWidth: '960px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', margin: 0 }}>
            Reviews &amp; Testimonials
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
            Manage customer reviews and testimonials
          </p>
        </div>
        <button
          onClick={openAdd}
          style={{
            background: '#EC1E79',
            color: '#000',
            border: 'none',
            borderRadius: '10px',
            padding: '0.625rem 1.25rem',
            fontSize: '0.875rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          + Add Review
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
              border: filter === f ? '1px solid #EC1E79' : '1px solid #1f1f1f',
              background: filter === f ? 'rgba(236,30,121,0.12)' : '#111',
              color: filter === f ? '#EC1E79' : '#9ca3af',
              fontSize: '0.8125rem',
              fontWeight: 600,
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
        <div style={{ color: '#6b7280', padding: '3rem', textAlign: 'center' }}>Loading reviews…</div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: '#111',
          border: '1px solid #1f1f1f',
          borderRadius: '12px',
          padding: '3rem',
          textAlign: 'center',
          color: '#6b7280',
        }}>
          {emptyMessages[filter]}
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
                background: '#111',
                border: '1px solid #1f1f1f',
                borderRadius: '12px',
                padding: '1.25rem',
              }}
            >
              {/* Top row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <StarRating rating={review.rating} />
                  <div>
                    <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.9375rem' }}>{review.name}</span>
                    {review.location && (
                      <span style={{ color: '#6b7280', fontSize: '0.8125rem', marginLeft: '0.5rem' }}>
                        {review.location}
                      </span>
                    )}
                  </div>
                </div>
                <span style={{ color: '#4b5563', fontSize: '0.75rem' }}>
                  {new Date(review.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>

              {/* Body */}
              <p style={{
                color: 'rgba(255,255,255,0.7)',
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
                    background: '#1f1f1f',
                    color: '#9ca3af',
                    fontSize: '0.75rem',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '999px',
                    border: '1px solid #374151',
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
                    fontWeight: 600,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '999px',
                    background: review.approved ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)',
                    color: review.approved ? '#4ade80' : '#fbbf24',
                    border: review.approved ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(245,158,11,0.3)',
                  }}>
                    {review.approved ? 'Approved' : 'Pending'}
                  </span>
                  {review.featured && (
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '0.2rem 0.6rem',
                      borderRadius: '999px',
                      background: 'rgba(236,30,121,0.12)',
                      color: '#EC1E79',
                      border: '1px solid rgba(236,30,121,0.3)',
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
                      background: review.approved ? 'rgba(34,197,94,0.1)' : '#1f1f1f',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      padding: '0.4rem 0.6rem',
                      cursor: 'pointer',
                      color: review.approved ? '#4ade80' : '#9ca3af',
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
                      background: review.featured ? 'rgba(236,30,121,0.1)' : '#1f1f1f',
                      border: '1px solid #374151',
                      borderRadius: '8px',
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
                      background: '#1f1f1f',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      padding: '0.4rem 0.6rem',
                      cursor: 'pointer',
                      color: '#9ca3af',
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
                      background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.25)',
                      borderRadius: '8px',
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
                background: '#111',
                borderLeft: '1px solid #1f1f1f',
                zIndex: 50,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Panel header */}
              <div style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid #1f1f1f',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}>
                <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#fff' }}>
                  {editingId ? 'Edit Review' : 'Add Review'}
                </h2>
                <button
                  onClick={closeForm}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#6b7280',
                    fontSize: '1.25rem',
                    cursor: 'pointer',
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
                {/* Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#9ca3af', marginBottom: '0.375rem' }}>
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
                      background: '#0a0a0a',
                      border: '1px solid #1f1f1f',
                      borderRadius: '8px',
                      padding: '0.625rem 0.875rem',
                      color: '#fff',
                      fontSize: '0.875rem',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Location */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#9ca3af', marginBottom: '0.375rem' }}>
                    Location
                  </label>
                  <input
                    value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="e.g. London, UK"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      background: '#0a0a0a',
                      border: '1px solid #1f1f1f',
                      borderRadius: '8px',
                      padding: '0.625rem 0.875rem',
                      color: '#fff',
                      fontSize: '0.875rem',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Rating */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#9ca3af', marginBottom: '0.5rem' }}>
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
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#9ca3af', marginBottom: '0.375rem' }}>
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
                      background: '#0a0a0a',
                      border: '1px solid #1f1f1f',
                      borderRadius: '8px',
                      padding: '0.625rem 0.875rem',
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
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#9ca3af', marginBottom: '0.375rem' }}>
                    Product Reference
                  </label>
                  <input
                    value={form.productRef}
                    onChange={e => setForm(f => ({ ...f, productRef: e.target.value }))}
                    placeholder="e.g. Charizard PSA 10"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      background: '#0a0a0a',
                      border: '1px solid #1f1f1f',
                      borderRadius: '8px',
                      padding: '0.625rem 0.875rem',
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
                          background: form[key] ? '#EC1E79' : '#374151',
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
                      <span style={{ color: '#9ca3af', fontSize: '0.875rem', fontWeight: 600 }}>{label}</span>
                    </label>
                  ))}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    background: '#EC1E79',
                    color: '#000',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '0.75rem',
                    fontSize: '0.9375rem',
                    fontWeight: 700,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.7 : 1,
                    marginTop: '0.5rem',
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
