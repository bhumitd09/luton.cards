'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, ArrowLeft, Tag, Package } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { WishlistButton } from '@/components/wishlist-button'
import { BackInStockButton } from '@/components/back-in-stock-button'
import { useCart } from '@/lib/cart-context'
import type { Product } from '@/lib/products'

// ── Related Products Card ──────────────────────────────────────────────────
function RelatedProductCard({ product, index }: { product: Product; index: number }) {
  const { addToCart } = useCart()
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    addToCart(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  const cardImage = product.images?.length ? product.images[0] : product.image

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -5, transition: { type: 'spring', stiffness: 300, damping: 18 } }}
      style={{
        background: '#fff',
        borderRadius: '18px',
        overflow: 'hidden',
        border: '1.5px solid #f0f0f0',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Link href={`/products/${product.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
        <div style={{
          width: '100%', aspectRatio: '4/3',
          background: '#f5f5f5', overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          {cardImage ? (
            <img
              src={cardImage}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '0.5rem' }}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
              <Tag size={32} color="#d1d5db" />
            </div>
          )}
          <span style={{
            position: 'absolute', top: '10px', left: '10px',
            background: 'rgba(0,0,0,0.7)', color: '#fff',
            padding: '0.2rem 0.6rem', borderRadius: '6px',
            fontSize: '0.6875rem', fontWeight: 700, textTransform: 'capitalize',
          }}>
            {product.category}
          </span>
          {product.grade && (
            <span style={{
              position: 'absolute', top: '10px', right: '10px',
              background: '#000', color: '#EC1E79',
              padding: '0.2rem 0.6rem', borderRadius: '6px',
              fontSize: '0.6875rem', fontWeight: 700,
            }}>
              {product.grade}
            </span>
          )}
        </div>
      </Link>

      <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Link href={`/products/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111', marginBottom: '0.35rem', lineHeight: 1.3 }}>
            {product.name}
          </h3>
        </Link>
        {product.description && (
          <p style={{ fontSize: '0.8125rem', color: '#6b7280', lineHeight: 1.5, marginBottom: '0.75rem', flex: 1 }}>
            {product.description.slice(0, 80)}&hellip;
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#EC1E79' }}>
            £{product.price.toLocaleString()}
          </span>
          <motion.button
            onClick={handleAdd}
            disabled={product.stock === 0 || added}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              background: added ? '#c81c6b' : product.stock === 0 ? '#e5e7eb' : '#EC1E79',
              color: product.stock === 0 ? '#9ca3af' : '#000',
              border: 'none', cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
              padding: '0.55rem 1rem', borderRadius: '10px',
              fontSize: '0.8125rem', fontWeight: 700,
              transition: 'background 0.2s ease',
            }}
          >
            <ShoppingCart size={14} />
            {added ? 'Added!' : product.stock === 0 ? 'Sold Out' : 'Add to Cart'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

// ── Related Products Section ───────────────────────────────────────────────
function RelatedProductsSection({ currentId, category }: { currentId: string; category: string }) {
  const [related, setRelated] = useState<Product[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!category) return
    fetch(`/api/products?category=${encodeURIComponent(category)}`)
      .then(res => res.json())
      .then((data: Product[]) => {
        const filtered = data
          .filter(p => p.id !== currentId)
          .slice(0, 4)
        setRelated(filtered)
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [currentId, category])

  if (!loaded || related.length === 0) return null

  return (
    <section style={{ background: '#fafafa', padding: '3rem 0' }}>
      <div className="container" style={{ padding: '0 1.5rem' }}>
        {/* Labels */}
        <div style={{ marginBottom: '1.25rem' }}>
          <span style={{
            display: 'inline-block',
            background: 'rgba(236,30,121,0.12)',
            color: '#EC1E79',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginBottom: '0.6rem',
          }}>
            More like this
          </span>
          <h2 style={{
            fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
            fontWeight: 800,
            color: '#111',
            margin: 0,
            letterSpacing: '-0.02em',
          }}>
            You might also like
          </h2>
        </div>

        {/* Grid */}
        <div className="related-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '1.5rem',
        }}>
          {related.map((p, i) => (
            <RelatedProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  graded:  { bg: '#fef3c7', color: '#92400e' },
  single:  { bg: '#dbeafe', color: '#1e40af' },
  booster: { bg: '#fce7f3', color: '#9d174d' },
  sealed:  { bg: '#d1fae5', color: '#065f46' },
}

const GRADER_COLORS: Record<string, { bg: string; border: string; color: string }> = {
  PSA: { bg: '#fffbeb', border: '#fbbf24', color: '#78350f' },
  CGC: { bg: '#fefce8', border: '#eab308', color: '#713f12' },
  ACE: { bg: '#fffbeb', border: '#f59e0b', color: '#92400e' },
}

function SkeletonBlock({ width, height, radius = 8 }: { width: string | number; height: number; radius?: number }) {
  return (
    <div
      style={{
        width, height, borderRadius: radius,
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s infinite',
      }}
    />
  )
}

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', gap: '3rem', padding: '3rem 0', flexWrap: 'wrap' }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0 }
          100% { background-position: -200% 0 }
        }
      `}</style>
      {/* Left */}
      <div style={{ flex: '0 0 60%', minWidth: '280px' }}>
        <SkeletonBlock width="100%" height={440} radius={18} />
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
          {[...Array(4)].map((_, i) => <SkeletonBlock key={i} width={80} height={80} radius={10} />)}
        </div>
      </div>
      {/* Right */}
      <div style={{ flex: 1, minWidth: '260px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <SkeletonBlock width={90} height={26} radius={9999} />
        <SkeletonBlock width="80%" height={40} />
        <SkeletonBlock width={120} height={36} />
        <SkeletonBlock width={160} height={24} />
        <SkeletonBlock width="100%" height={100} />
        <SkeletonBlock width="100%" height={52} radius={12} />
      </div>
    </div>
  )
}

export default function ProductDetailPage() {
  const params = useParams()
  const id = params?.id as string

  const { addToCart, canAddMore, cartQuantity } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeImage, setActiveImage] = useState(0)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetch(`/api/products/${id}`)
      .then(res => {
        if (res.status === 404) { setNotFound(true); setLoading(false); return null }
        return res.json()
      })
      .then(data => {
        if (data && !data.error) {
          setProduct(data)
        } else if (data?.error) {
          setNotFound(true)
        }
        setLoading(false)
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [id])

  useEffect(() => {
    if (product) {
      document.title = `${product.name} | Luton Cards`
    }
  }, [product])

  const handleAddToCart = () => {
    if (!product || !canAddMore(product)) return
    addToCart(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  const images: string[] = product?.images?.length
    ? product.images
    : product?.image
      ? [product.image]
      : []

  const categoryStyle = product
    ? (CATEGORY_COLORS[product.category] ?? { bg: '#f3f4f6', color: '#374151' })
    : { bg: '#f3f4f6', color: '#374151' }

  const graderKey = (product?.grader ?? product?.grade ?? '').toString().split(' ')[0].toUpperCase()
  const graderStyle = GRADER_COLORS[graderKey] ?? { bg: '#fffbeb', border: '#fbbf24', color: '#78350f' }

  const stockStatus = product
    ? product.stock === 0
      ? { label: 'Sold Out', color: '#ef4444', bg: '#fef2f2' }
      : product.stock <= 3
        ? { label: `Low Stock (${product.stock} left)`, color: '#f59e0b', bg: '#fffbeb' }
        : { label: `In Stock (${product.stock} available)`, color: '#10b981', bg: '#ecfdf5' }
    : null

  return (
    <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0 }
          100% { background-position: -200% 0 }
        }
        @media (max-width: 768px) {
          .product-layout { flex-direction: column !important; gap: 1.5rem !important; }
          .product-left { flex: none !important; min-width: unset !important; width: 100% !important; }
          .product-right { flex: none !important; min-width: unset !important; width: 100% !important; }
          .related-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      <Header />

      <main style={{ flex: 1 }}>
        {/* Breadcrumb bar */}
        <div style={{
          background: '#fafafa', borderBottom: '1px solid #f0f0f0',
          padding: '0.75rem 0',
        }}>
          <div className="container">
            <Link
              href="/products"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                color: '#6b7280', fontSize: '0.875rem', fontWeight: 500,
                textDecoration: 'none',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#EC1E79')}
              onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}
            >
              <ArrowLeft size={14} />
              Back to Shop
            </Link>
          </div>
        </div>

        <div className="container" style={{ padding: '2.5rem 1.5rem 4rem' }}>
          {loading ? (
            <LoadingSkeleton />
          ) : notFound ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ textAlign: 'center', padding: '6rem 1rem' }}
            >
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: '#fef2f2', display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 1.5rem',
              }}>
                <Package size={32} color="#ef4444" />
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111', marginBottom: '0.5rem' }}>
                Product Not Found
              </h1>
              <p style={{ color: '#6b7280', marginBottom: '2rem', fontSize: '1rem' }}>
                This card doesn&apos;t exist or may have been removed.
              </p>
              <Link
                href="/products"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  background: '#EC1E79', color: '#000', fontWeight: 700,
                  padding: '0.75rem 1.75rem', borderRadius: '12px',
                  textDecoration: 'none', fontSize: '0.9375rem',
                }}
              >
                <ArrowLeft size={16} />
                Browse All Cards
              </Link>
            </motion.div>
          ) : product ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="product-layout"
              style={{ display: 'flex', gap: '3.5rem', alignItems: 'flex-start' }}
            >
              {/* ── LEFT: Images (60%) ── */}
              <div className="product-left" style={{ flex: '0 0 60%', minWidth: '280px' }}>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  {/* Main image */}
                  <div style={{
                    width: '100%', aspectRatio: '4/3',
                    background: '#f5f5f5', borderRadius: '20px',
                    overflow: 'hidden', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    border: '1.5px solid #ebebeb',
                    position: 'relative',
                  }}>
                    <AnimatePresence mode="wait">
                      {images.length > 0 ? (
                        <motion.img
                          key={activeImage}
                          src={images[activeImage]}
                          alt={product.name}
                          initial={{ opacity: 0, scale: 0.97 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 1.02 }}
                          transition={{ duration: 0.25 }}
                          style={{
                            width: '100%', height: '100%',
                            objectFit: 'contain', padding: '1.5rem',
                          }}
                        />
                      ) : (
                        <motion.div
                          key="placeholder"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          style={{
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            gap: '0.75rem', padding: '2rem', textAlign: 'center',
                          }}
                        >
                          <div style={{
                            width: 80, height: 80, borderRadius: '50%',
                            background: 'rgba(236,30,121,0.08)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Tag size={36} color="#EC1E79" />
                          </div>
                          <p style={{ fontWeight: 700, fontSize: '1rem', color: '#374151', margin: 0 }}>
                            {product.name}
                          </p>
                          <span style={{
                            background: categoryStyle.bg, color: categoryStyle.color,
                            padding: '0.25rem 0.75rem', borderRadius: '9999px',
                            fontSize: '0.8125rem', fontWeight: 700, textTransform: 'capitalize',
                          }}>
                            {product.category}
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Thumbnails */}
                  {images.length > 1 && (
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                      {images.map((src, i) => (
                        <motion.button
                          key={i}
                          onClick={() => setActiveImage(i)}
                          whileHover={{ scale: 1.06 }}
                          whileTap={{ scale: 0.95 }}
                          style={{
                            width: 80, height: 80, padding: '0.25rem',
                            borderRadius: '10px', overflow: 'hidden',
                            border: `2px solid ${activeImage === i ? '#EC1E79' : '#e5e7eb'}`,
                            background: '#f5f5f5', cursor: 'pointer',
                            transition: 'border-color 0.2s',
                            flexShrink: 0,
                          }}
                        >
                          <img
                            src={src}
                            alt={`${product.name} ${i + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                        </motion.button>
                      ))}
                    </div>
                  )}
                </motion.div>
              </div>

              {/* ── RIGHT: Details (40%) ── */}
              <motion.div
                className="product-right"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, delay: 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{ flex: 1, minWidth: '260px' }}
              >
                {/* Category + Grade badges */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  <span style={{
                    background: categoryStyle.bg, color: categoryStyle.color,
                    padding: '0.3rem 0.85rem', borderRadius: '9999px',
                    fontSize: '0.8125rem', fontWeight: 700, textTransform: 'capitalize',
                  }}>
                    {product.category}
                  </span>
                  {product.grade && (
                    <span style={{
                      background: graderStyle.bg,
                      border: `1.5px solid ${graderStyle.border}`,
                      color: graderStyle.color,
                      padding: '0.3rem 0.85rem', borderRadius: '9999px',
                      fontSize: '0.8125rem', fontWeight: 800,
                      letterSpacing: '0.03em',
                    }}>
                      {product.grader ? `${product.grader} ` : ''}{product.grade}
                    </span>
                  )}
                </div>

                {/* Product name */}
                <h1 style={{
                  fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 900,
                  color: '#111', lineHeight: 1.2, marginBottom: '1.25rem',
                  letterSpacing: '-0.02em',
                }}>
                  {product.name}
                </h1>

                {/* Pricing */}
                <div style={{ marginBottom: '1.25rem' }}>
                  {product.comparePrice && product.comparePrice > product.price && (
                    <p style={{
                      fontSize: '1rem', color: '#9ca3af',
                      textDecoration: 'line-through', margin: '0 0 0.2rem',
                      fontWeight: 500,
                    }}>
                      £{product.comparePrice.toFixed(2)}
                    </p>
                  )}
                  <p style={{
                    fontSize: '2.25rem', fontWeight: 900, color: '#EC1E79',
                    margin: 0, letterSpacing: '-0.03em', lineHeight: 1,
                  }}>
                    £{product.price.toFixed(2)}
                  </p>
                </div>

                {/* Stock indicator */}
                {stockStatus && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    background: stockStatus.bg, color: stockStatus.color,
                    padding: '0.4rem 1rem', borderRadius: '9999px',
                    fontSize: '0.875rem', fontWeight: 700, marginBottom: '1.5rem',
                  }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: stockStatus.color, flexShrink: 0,
                    }} />
                    {stockStatus.label}
                  </div>
                )}

                {/* Description */}
                {product.description && (
                  <p style={{
                    fontSize: '0.9375rem', color: '#4b5563', lineHeight: 1.7,
                    marginBottom: '1.5rem',
                  }}>
                    {product.description}
                  </p>
                )}

                {/* Tags */}
                {product.tags && product.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.75rem' }}>
                    {product.tags.map(tag => (
                      <span
                        key={tag}
                        style={{
                          background: '#f3f4f6', color: '#374151',
                          padding: '0.25rem 0.7rem', borderRadius: '9999px',
                          fontSize: '0.8125rem', fontWeight: 600,
                          border: '1px solid #e5e7eb',
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Add to Cart */}
                <motion.button
                  onClick={handleAddToCart}
                  disabled={!canAddMore(product) || added}
                  whileHover={canAddMore(product) && !added ? { scale: 1.02 } : {}}
                  whileTap={canAddMore(product) && !added ? { scale: 0.97 } : {}}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '0.6rem',
                    background: added
                      ? '#c81c6b'
                      : product.stock === 0 || !canAddMore(product)
                        ? '#e5e7eb'
                        : '#EC1E79',
                    color: product.stock === 0 || !canAddMore(product) ? '#9ca3af' : '#000',
                    border: 'none',
                    cursor: !canAddMore(product) ? 'not-allowed' : 'pointer',
                    padding: '1rem 1.5rem', borderRadius: '14px',
                    fontSize: '1rem', fontWeight: 800,
                    transition: 'background 0.25s ease',
                    marginBottom: '0.5rem',
                    letterSpacing: '-0.01em',
                  }}
                >
                  <ShoppingCart size={18} />
                  {added
                    ? 'Added \u2713'
                    : product.stock === 0
                      ? 'Sold Out'
                      : !canAddMore(product)
                        ? 'Max in Cart'
                        : 'Add to Cart'}
                </motion.button>

                {/* Save to wishlist */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <WishlistButton productId={product.id} variant="inline" />
                </div>

                {/* Back-in-stock subscribe (only when sold out) */}
                {product.stock === 0 && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <BackInStockButton productId={product.id} />
                  </div>
                )}
                {product.stock > 0 && product.stock <= 10 && (
                  <p style={{ fontSize: '0.8125rem', color: '#f59e0b', marginTop: '0.5rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                    Only {product.stock} in stock
                    {cartQuantity(product.id) > 0 && ` · ${cartQuantity(product.id)} already in your cart`}
                  </p>
                )}

                {/* Back to shop */}
                <Link
                  href="/products"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    color: '#6b7280', fontSize: '0.875rem', fontWeight: 500,
                    textDecoration: 'none', transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#EC1E79')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}
                >
                  <ArrowLeft size={14} />
                  Back to shop
                </Link>
              </motion.div>
            </motion.div>
          ) : null}
        </div>

        {/* Related products — only shown when the current product is loaded */}
        {product && (
          <RelatedProductsSection currentId={product.id} category={product.category} />
        )}
      </main>

      <Footer />
    </div>
  )
}
