'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { useCart } from '@/lib/cart-context'
import { track } from '@/lib/analytics'

function CheckoutSuccessContent() {
  const { clearCart, items, discountedTotal, totalItems } = useCart()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const orderId = searchParams.get('order_id')

  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Capture the purchase (with revenue) BEFORE clearing the cart.
    track('order_completed', {
      order_id: orderId || sessionId || undefined,
      value: discountedTotal,
      currency: 'GBP',
      items_count: totalItems,
      product_ids: items.map(i => i.product.id),
    })
    clearCart()
    // Trigger animation after mount
    const timer = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(timer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const reference = orderId || sessionId

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      <Header />
      <main>
        <div style={{
          maxWidth: '560px',
          margin: '0 auto',
          padding: '6rem 1.5rem 5rem',
          textAlign: 'center',
        }}>
          {/* Animated checkmark circle */}
          <div style={{
            transform: visible ? 'scale(1)' : 'scale(0.4)',
            opacity: visible ? 1 : 0,
            transition: 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.35s ease',
            width: '88px',
            height: '88px',
            background: 'linear-gradient(135deg, #EC1E7922, #EC1E7944)',
            border: '2px solid #EC1E7955',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 2rem',
          }}>
            <svg
              width="38"
              height="38"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#EC1E79"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          {/* Heading */}
          <h1 style={{
            fontSize: 'clamp(1.875rem, 4vw, 2.5rem)',
            fontWeight: 900,
            color: '#ffffff',
            letterSpacing: '-0.03em',
            marginBottom: '1rem',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 0.4s ease 0.15s, transform 0.4s ease 0.15s',
          }}>
            Order Confirmed!
          </h1>

          {/* Body text */}
          <p style={{
            fontSize: '1.0625rem',
            color: 'rgba(255,255,255,0.6)',
            lineHeight: 1.7,
            marginBottom: reference ? '0.75rem' : '2.5rem',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 0.4s ease 0.25s, transform 0.4s ease 0.25s',
          }}>
            Thank you! Your order has been received and we&apos;ll be in touch shortly.
          </p>

          {/* Order reference */}
          {reference && (
            <p style={{
              fontSize: '0.8125rem',
              color: 'rgba(255,255,255,0.35)',
              marginBottom: '2.5rem',
              opacity: visible ? 1 : 0,
              transition: 'opacity 0.4s ease 0.3s',
            }}>
              Order reference:{' '}
              <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.65)', fontFamily: 'monospace' }}>
                {reference}
              </span>
            </p>
          )}

          {/* CTA */}
          <div style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 0.4s ease 0.35s, transform 0.4s ease 0.35s',
          }}>
            <Link
              href="/products"
              style={{
                display: 'inline-block',
                background: '#EC1E79',
                color: '#000',
                fontWeight: 800,
                fontSize: '0.9375rem',
                padding: '0.875rem 2.25rem',
                borderRadius: '12px',
                textDecoration: 'none',
                letterSpacing: '-0.01em',
              }}
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>Loading...</div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  )
}
