'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Star, BadgeCheck, AlertCircle, Check, Loader2, MessageSquarePlus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type ReviewItem = {
  id: string
  name: string
  location: string | null
  rating: number
  title: string | null
  body: string
  verifiedPurchase: boolean
  createdAt: string
}

type ReviewsPayload = {
  reviews: ReviewItem[]
  count: number
  avgRating: number | null
}

export function ProductReviews({ productId }: { productId: string }) {
  const [data, setData] = useState<ReviewsPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [writeOpen, setWriteOpen] = useState(false)

  const load = () => {
    setLoading(true)
    fetch(`/api/reviews?productId=${encodeURIComponent(productId)}`)
      .then(r => (r.ok ? r.json() : { reviews: [], count: 0, avgRating: null }))
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { setData({ reviews: [], count: 0, avgRating: null }); setLoading(false) })
  }

  useEffect(load, [productId])

  return (
    <section style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #eee' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem',
      }}>
        <div>
          <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 800, color: '#EC1E79', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
            Reviews
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginTop: '0.4rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#111', letterSpacing: '-0.025em' }}>
              {loading ? '–' : data?.avgRating ? data.avgRating.toFixed(1) : 'No reviews yet'}
            </h2>
            {data && data.avgRating !== null && (
              <>
                <Stars rating={data.avgRating} size={14} />
                <span style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                  · {data.count} {data.count === 1 ? 'review' : 'reviews'}
                </span>
              </>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setWriteOpen(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            background: '#111', color: '#fff',
            border: 'none', padding: '0.55rem 1rem', borderRadius: 9,
            fontSize: '0.825rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <MessageSquarePlus size={14} /> Write a review
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ padding: '2rem 0', color: '#9ca3af', fontSize: '0.875rem' }}>Loading reviews…</div>
      ) : !data || data.reviews.length === 0 ? (
        <div style={{
          padding: '2.5rem 1.5rem', textAlign: 'center',
          borderRadius: 14, border: '1.5px dashed #e5e7eb', background: '#fafafa',
        }}>
          <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#374151' }}>
            Be the first to review this card.
          </p>
          <p style={{ margin: '0.4rem 0 0', fontSize: '0.8125rem', color: '#6b7280' }}>
            Sign in and share what you think. It helps other collectors.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {data.reviews.map(r => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {writeOpen && (
          <WriteReviewModal
            productId={productId}
            onClose={() => setWriteOpen(false)}
            onSubmitted={() => { setWriteOpen(false); load() }}
          />
        )}
      </AnimatePresence>
    </section>
  )
}

function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 1.5 }}>
      {[1, 2, 3, 4, 5].map(i => {
        const filled = i <= Math.round(rating)
        return (
          <Star
            key={i}
            size={size}
            color={filled ? '#f59e0b' : '#d1d5db'}
            fill={filled ? '#f59e0b' : 'none'}
            strokeWidth={2}
          />
        )
      })}
    </span>
  )
}

function ReviewCard({ review }: { review: ReviewItem }) {
  const date = new Date(review.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  return (
    <div style={{
      border: '1px solid #eee', borderRadius: 12, padding: '1rem 1.25rem',
      background: '#fff',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <Stars rating={review.rating} size={13} />
          {review.verifiedPurchase && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              fontSize: '0.65rem', fontWeight: 800, color: '#059669',
              background: '#dcfce7', padding: '2px 6px', borderRadius: 4,
              textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>
              <BadgeCheck size={10} /> Verified purchase
            </span>
          )}
        </div>
        <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{date}</span>
      </div>
      {review.title && (
        <p style={{ margin: '0.6rem 0 0.3rem', fontSize: '0.95rem', fontWeight: 800, color: '#111' }}>
          {review.title}
        </p>
      )}
      <p style={{ margin: review.title ? '0.2rem 0 0.625rem' : '0.6rem 0 0.625rem', fontSize: '0.875rem', lineHeight: 1.55, color: '#374151', whiteSpace: 'pre-wrap' }}>
        {review.body}
      </p>
      <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>
        <span style={{ fontWeight: 700, color: '#111' }}>{review.name}</span>
        {review.location ? <>, {review.location}</> : null}
      </p>
    </div>
  )
}

function WriteReviewModal({
  productId, onClose, onSubmitted,
}: {
  productId: string
  onClose: () => void
  onSubmitted: () => void
}) {
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ verifiedPurchase: boolean } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (rating < 1) { setError('Pick a rating from 1 to 5'); return }
    if (body.trim().length < 8) { setError('Review must be at least 8 characters'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, rating, title: title.trim() || undefined, body: body.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 401) {
        // Not logged in — redirect to login + come back
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`)
        return
      }
      if (!res.ok) {
        setError(data?.error || 'Could not submit review.')
        setSubmitting(false)
        return
      }
      setSuccess({ verifiedPurchase: !!data.verifiedPurchase })
    } catch {
      setError('Network error. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200, padding: '1rem',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: 480, width: '100%', background: '#fff',
          borderRadius: 16, padding: '1.75rem', maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        {success ? (
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: '#dcfce7', color: '#059669',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem',
            }}>
              <Check size={26} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#111' }}>Thanks for your review!</h3>
            <p style={{ margin: '0.4rem 0 0', fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.55 }}>
              {success.verifiedPurchase
                ? "It'll appear with a 'Verified Purchase' badge once a team member approves it."
                : "It'll appear publicly once a team member approves it."}
            </p>
            <button
              type="button"
              onClick={onSubmitted}
              style={{
                marginTop: '1.25rem', background: '#EC1E79', color: '#fff',
                border: 'none', padding: '0.65rem 1.5rem', borderRadius: 10,
                fontSize: '0.875rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#111', letterSpacing: '-0.02em' }}>
              Write a review
            </h3>
            <p style={{ margin: '0.4rem 0 1.25rem', fontSize: '0.825rem', color: '#6b7280' }}>
              Submitted reviews are reviewed before publishing.
            </p>

            {/* Rating */}
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
              Your rating
            </label>
            <div style={{ display: 'flex', gap: 4, marginBottom: '1.25rem' }}>
              {[1, 2, 3, 4, 5].map(i => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i)}
                  onMouseEnter={() => setHoverRating(i)}
                  onMouseLeave={() => setHoverRating(0)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: 2,
                  }}
                >
                  <Star
                    size={28}
                    color={(hoverRating || rating) >= i ? '#f59e0b' : '#d1d5db'}
                    fill={(hoverRating || rating) >= i ? '#f59e0b' : 'none'}
                    strokeWidth={2}
                  />
                </button>
              ))}
            </div>

            {/* Title */}
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
              Title (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={100}
              placeholder="One-liner summary"
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '0.65rem 0.85rem', borderRadius: 9,
                border: '1.5px solid #e5e7eb', fontSize: '0.875rem',
                outline: 'none', fontFamily: 'inherit',
                marginBottom: '1rem',
              }}
            />

            {/* Body */}
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
              Your review
            </label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              minLength={8}
              maxLength={2000}
              rows={5}
              placeholder="How was the condition, packaging, delivery? Would you buy again?"
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '0.65rem 0.85rem', borderRadius: 9,
                border: '1.5px solid #e5e7eb', fontSize: '0.875rem',
                outline: 'none', fontFamily: 'inherit', resize: 'vertical',
                lineHeight: 1.6, marginBottom: '0.5rem',
              }}
            />
            <p style={{ margin: '0 0 1rem', fontSize: '0.7rem', color: '#9ca3af', textAlign: 'right' }}>
              {body.length}/2000
            </p>

            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                marginBottom: '1rem', padding: '0.65rem 0.85rem',
                background: '#fef2f2', border: '1.5px solid #fecaca',
                borderRadius: 9, fontSize: '0.825rem', color: '#dc2626',
              }}>
                <AlertCircle size={13} />
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: '#fff', color: '#374151',
                  border: '1.5px solid #e5e7eb', padding: '0.6rem 1.1rem', borderRadius: 9,
                  fontSize: '0.825rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || rating < 1 || body.trim().length < 8}
                style={{
                  background: submitting || rating < 1 || body.trim().length < 8 ? '#fcc' : '#EC1E79',
                  color: '#fff', border: 'none',
                  padding: '0.6rem 1.25rem', borderRadius: 9,
                  fontSize: '0.825rem', fontWeight: 800,
                  cursor: submitting ? 'wait' : 'pointer', fontFamily: 'inherit',
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                }}
              >
                {submitting && <Loader2 size={13} className="animate-spin" />}
                Submit review
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  )
}
