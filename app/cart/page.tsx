'use client'

import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { useCart } from '@/lib/cart-context'

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, totalPrice, totalItems, cartQuantity, liveStock } = useCart()

  // Helper: get the real current stock for an item (live > cached)
  const getStock = (productId: string, fallback: number) =>
    liveStock[productId] !== undefined ? liveStock[productId] : fallback

  if (items.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#fff' }}>
        <Header />
        <main>
          <div style={{
            maxWidth: '480px',
            margin: '0 auto',
            padding: '5rem 1.5rem',
            textAlign: 'center',
          }}>
            <div style={{
              width: '72px', height: '72px',
              background: '#f3f4f6',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.75rem',
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111', marginBottom: '0.5rem' }}>
              Your cart is empty
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
              Browse the collection and add some cards.
            </p>
            <Link href="/products" style={{
              display: 'inline-block',
              background: '#EC1E79',
              color: '#000',
              fontWeight: 800,
              fontSize: '0.9375rem',
              padding: '0.75rem 2rem',
              borderRadius: '10px',
              textDecoration: 'none',
            }}>
              Browse Cards
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      <Header />
      <main>
        {/* Page header */}
        <div style={{
          background: 'linear-gradient(135deg, #000 0%, #111 50%, #0d1a17 100%)',
          padding: '3rem 0 2.5rem',
        }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.5rem' }}>
            <h1 style={{
              fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
              fontWeight: 900,
              color: '#fff',
              letterSpacing: '-0.025em',
              margin: 0,
            }}>
              Your Cart
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem', marginTop: '0.4rem' }}>
              {totalItems} item{totalItems !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="cart-layout" style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '2.5rem 1.5rem 4rem',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 340px',
          gap: '3rem',
          alignItems: 'start',
        }}>
          {/* Items list */}
          <div className="cart-items">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {items.map((item) => (
                <div key={item.product.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  background: '#f9fafb',
                  borderRadius: '14px',
                  border: '1.5px solid #f0f0f0',
                }}>
                  {/* Product image */}
                  <div className="cart-item-img" style={{
                    width: '72px', height: '72px', flexShrink: 0,
                    background: '#fff', borderRadius: '10px',
                    border: '1px solid #e5e7eb',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                  }}>
                    {item.product.image ? (
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }}
                      />
                    ) : (
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                      </svg>
                    )}
                  </div>

                  {/* Product info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontWeight: 700, fontSize: '0.9375rem', color: '#111',
                      margin: '0 0 0.2rem', lineHeight: 1.3,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {item.product.name}
                    </p>
                    <p style={{ fontSize: '0.8125rem', color: '#9ca3af', margin: 0, textTransform: 'capitalize' }}>
                      {item.product.category}
                    </p>
                  </div>

                  {/* Qty controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="cart-qty-btn"
                      style={{
                        width: '30px', height: '30px', borderRadius: '8px',
                        border: '1.5px solid #e5e7eb', background: '#fff',
                        cursor: 'pointer', fontSize: '1rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#374151',
                      }}
                    >
                      -
                    </button>
                    <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111', minWidth: '20px', textAlign: 'center' }}>
                      {item.quantity}
                    </span>
                    {item.quantity >= getStock(item.product.id, item.product.stock) ? (
                      <span style={{
                        fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af',
                        minWidth: '30px', textAlign: 'center',
                      }}>
                        Max
                      </span>
                    ) : (
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="cart-qty-btn"
                        style={{
                          width: '30px', height: '30px', borderRadius: '8px',
                          border: '1.5px solid #e5e7eb', background: '#fff',
                          cursor: 'pointer', fontSize: '1rem', fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#374151',
                        }}
                      >
                        +
                      </button>
                    )}
                  </div>

                  {/* Price */}
                  <span style={{
                    fontWeight: 800, fontSize: '1rem', color: '#EC1E79',
                    minWidth: '70px', textAlign: 'right',
                  }}>
                    £{(item.product.price * item.quantity).toFixed(2)}
                  </span>

                  {/* Remove */}
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    title="Remove"
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#d1d5db', padding: '4px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: '6px',
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#d1d5db')}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <Link href="/products" style={{
                color: '#6b7280', fontSize: '0.875rem', fontWeight: 600,
                textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* Summary */}
          <div className="cart-summary" style={{
            background: '#f9fafb',
            borderRadius: '16px',
            border: '1.5px solid #f0f0f0',
            padding: '1.75rem',
            position: 'sticky',
            top: '90px',
          }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#111', marginBottom: '1.25rem' }}>
              Order Summary
            </h2>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                {totalItems} item{totalItems !== 1 ? 's' : ''}
              </span>
              <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#111' }}>
                £{totalPrice.toFixed(2)}
              </span>
            </div>

            <div style={{
              borderTop: '1.5px solid #e5e7eb',
              paddingTop: '1rem',
              marginBottom: '1.25rem',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#fff',
                borderRadius: '10px',
                padding: '0.875rem 1rem',
                border: '1.5px solid #e5e7eb',
              }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#111' }}>Total</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#EC1E79' }}>
                  £{totalPrice.toFixed(2)}
                </span>
              </div>
            </div>

            <Link href="/checkout" style={{ display: 'block', textDecoration: 'none' }}>
              <button style={{
                width: '100%',
                background: '#EC1E79',
                color: '#000',
                border: 'none',
                padding: '0.9rem 1.5rem',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}>
                Proceed to Checkout
              </button>
            </Link>

            <p style={{
              fontSize: '0.75rem',
              color: '#9ca3af',
              textAlign: 'center',
              marginTop: '0.875rem',
            }}>
              Secure checkout
            </p>
          </div>
        </div>
      </main>
      <Footer />

      <style>{`
        @media (max-width: 768px) {
          .cart-layout {
            grid-template-columns: 1fr !important;
            padding: 1.5rem 1rem 3rem !important;
          }
          .cart-summary {
            position: static !important;
            order: 2;
            border-top: 1.5px solid #e5e7eb;
            padding-top: 1.5rem;
          }
          .cart-items {
            order: 1;
          }
          .cart-item-img {
            width: 56px !important;
            height: 56px !important;
          }
          .cart-qty-btn {
            width: 36px !important;
            height: 36px !important;
          }
        }
      `}</style>
    </div>
  )
}
