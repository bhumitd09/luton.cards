'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'

interface Review {
  id: string
  name: string
  location: string | null
  rating: number
  body: string
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: '2px', marginBottom: '0.875rem' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} style={{ color: n <= rating ? '#EC1E79' : '#d1d5db', fontSize: '1rem', lineHeight: 1 }}>
          ★
        </span>
      ))}
    </div>
  )
}

function ReviewCard({ review, index }: { review: Review; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.45, delay: index * 0.08, ease: 'easeOut' }}
      style={{
        background: '#fff',
        border: '1.5px solid #ebebeb',
        borderRadius: '16px',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <StarRow rating={review.rating} />
      <p style={{
        color: '#374151',
        lineHeight: 1.7,
        fontSize: '0.9375rem',
        fontStyle: 'italic',
        flex: 1,
        margin: '0 0 1.25rem',
      }}>
        &ldquo;{review.body}&rdquo;
      </p>
      <div>
        <div style={{ fontWeight: 700, color: '#111', fontSize: '0.9375rem' }}>{review.name}</div>
        {review.location && (
          <div style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.125rem' }}>{review.location}</div>
        )}
      </div>
    </motion.div>
  )
}

export default function TestimonialsSection() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/reviews')
      .then(r => r.json())
      .then(data => {
        setReviews(data.reviews ?? [])
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  if (!loaded || reviews.length === 0) return null

  return (
    <section style={{ background: '#fff', padding: '5rem 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
        {/* Label */}
        <p style={{
          color: '#EC1E79',
          fontWeight: 700,
          fontSize: '0.75rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: '0.75rem',
        }}>
          What collectors say
        </p>

        {/* Heading */}
        <h2 style={{
          fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
          fontWeight: 800,
          color: '#111',
          margin: '0 0 3rem',
          lineHeight: 1.2,
        }}>
          Don&rsquo;t take our word for it.
        </h2>

        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.5rem',
        }}>
          {reviews.map((review, i) => (
            <ReviewCard key={review.id} review={review} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
