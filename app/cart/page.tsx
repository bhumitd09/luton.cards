'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Tag, X, Check, AlertCircle } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { useCart } from '@/lib/cart-context'

export default function CartPage() {
  const {
    items, updateQuantity, removeFromCart, totalPrice, totalItems,
    cartQuantity, liveStock, discount, applyDiscount, removeDiscount, discountedTotal,
  } = useCart()
  const [codeInput, setCodeInput] = useState('')
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleApply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!codeInput.trim()) return
    setApplying(true)
    setError(null)
    const result = await applyDiscount(codeInput)
    if (!result.ok) setError(result.reason || 'Invalid code')
    else setCodeInput('')
    setApplying(false)
  }

  // Helper: get the real current stock for an item. Variant-backed lines
  // key on `${productId}:${variantId}` (matches the stock API + cart context);
  // single-SKU lines key on productId. Falls back to whatever the cart item
  // captured at add-to-cart time, then to the product's base stock.
  const stockKey = (productId: string, variantId?: string) =>
    variantId ? `${productId}:${variantId}` : productId
  const getStock = (productId: string, fallback: number, variantId?: string) => {
    const k = stockKey(productId, variantId)
    if (liveStock[k] !== undefined) return liveStock[k]
    return fallback
  }
  // Price for a cart line — variant snapshot wins; falls back to product.price.
  const linePrice = (item: { product: { price: number }; variantPrice?: number }) =>
    item.variantPrice ?? item.product.price

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
                <div key={`${item.product.id}|${item.variantId ?? ''}`} className="cart-item" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  background: '#f9fafb',
                  borderRadius: '14px',
                  border: '1.5px solid #f0f0f0',
                  flexWrap: 'wrap',
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
                  <div className="cart-item-info" style={{ flex: 1, minWidth: 0 }}>
                    <p className="cart-item-name" style={{
                      fontWeight: 700, fontSize: '0.9375rem', color: '#111',
                      margin: '0 0 0.2rem', lineHeight: 1.3,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {item.product.name}
                    </p>
                    <p style={{ fontSize: '0.8125rem', color: '#9ca3af', margin: 0, textTransform: 'capitalize' }}>
                      {item.product.category}
                    </p>
                    {item.variantLabel && (
                      <p style={{
                        fontSize: '0.75rem', color: '#EC1E79', fontWeight: 700,
                        margin: '0.25rem 0 0', letterSpacing: '0.02em',
                      }}>
                        {item.variantLabel}
                      </p>
                    )}
                  </div>

                  {/* Actions group: qty + price + remove (wraps below info on narrow screens) */}
                  <div className="cart-item-actions" style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                  }}>
                    {/* Qty controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.variantId)}
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
                      {item.quantity >= getStock(item.product.id, item.variantStock ?? item.product.stock, item.variantId) ? (
                        <span style={{
                          fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af',
                          minWidth: '30px', textAlign: 'center',
                        }}>
                          Max
                        </span>
                      ) : (
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.variantId)}
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
                      £{(linePrice(item) * item.quantity).toFixed(2)}
                    </span>

                    {/* Remove */}
                    <button
                      onClick={() => removeFromCart(item.product.id, item.variantId)}
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

            {/* Subtotal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Subtotal · {totalItems} item{totalItems !== 1 ? 's' : ''}
              </span>
              <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#111' }}>
                £{totalPrice.toFixed(2)}
              </span>
            </div>

            {/* Discount code section */}
            <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #f0f0f0' }}>
              {discount ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#f0fdf4',
                    border: '1.5px solid #86efac',
                    borderRadius: 10,
                    padding: '0.6rem 0.85rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Check size={14} style={{ color: '#15803d' }} />
                    <div>
                      <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 800, color: '#15803d' }}>
                        {discount.code} applied
                      </p>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: '#15803d' }}>
                        {discount.type === 'percentage' ? `${discount.value}% off` : `£${discount.value} off`} · saving £{discount.savings.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeDiscount}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#15803d', padding: 4, display: 'flex',
                    }}
                    title="Remove discount"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApply}>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#6b7280', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
                    Discount code
                  </label>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      background: '#fff',
                      border: `1.5px solid ${error ? '#fca5a5' : '#e5e7eb'}`,
                      borderRadius: 9,
                      padding: '0.45rem 0.7rem',
                    }}>
                      <Tag size={13} style={{ color: '#9ca3af', flexShrink: 0 }} />
                      <input
                        type="text"
                        value={codeInput}
                        onChange={e => { setCodeInput(e.target.value.toUpperCase()); setError(null) }}
                        placeholder="ENTER CODE"
                        style={{
                          flex: 1, border: 'none', outline: 'none', background: 'transparent',
                          fontSize: '0.85rem', fontFamily: 'inherit', fontWeight: 700,
                          letterSpacing: '0.05em', color: '#111',
                          textTransform: 'uppercase',
                        }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={applying || !codeInput.trim()}
                      style={{
                        background: '#111', color: '#fff', border: 'none',
                        padding: '0.45rem 1rem', borderRadius: 9,
                        fontSize: '0.8rem', fontWeight: 800,
                        cursor: applying || !codeInput.trim() ? 'not-allowed' : 'pointer',
                        opacity: applying || !codeInput.trim() ? 0.5 : 1,
                        fontFamily: 'inherit',
                      }}
                    >
                      {applying ? '…' : 'Apply'}
                    </button>
                  </div>
                  {error && (
                    <p style={{
                      margin: '0.5rem 0 0', display: 'flex', alignItems: 'center', gap: '0.3rem',
                      fontSize: '0.75rem', color: '#dc2626',
                    }}>
                      <AlertCircle size={11} /> {error}
                    </p>
                  )}
                </form>
              )}
            </div>

            {/* Discount line */}
            {discount && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#15803d', fontWeight: 600 }}>
                  Discount ({discount.code})
                </span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#15803d' }}>
                  −£{discount.savings.toFixed(2)}
                </span>
              </div>
            )}

            {/* Total */}
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
                  £{discountedTotal.toFixed(2)}
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
        /* Reflow the action group below the image + name on phones to
           prevent crushing the product name and overflowing the row. */
        @media (max-width: 520px) {
          .cart-item {
            gap: 0.75rem !important;
            padding: 0.85rem !important;
          }
          .cart-item-name {
            white-space: normal !important;
            overflow: visible !important;
            text-overflow: clip !important;
          }
          .cart-item-actions {
            flex: 1 0 100% !important;
            justify-content: space-between !important;
            margin-top: 0.25rem;
            padding-top: 0.75rem;
            border-top: 1px dashed #e5e7eb;
          }
        }
      `}</style>
    </div>
  )
}
