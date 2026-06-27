'use client'

import { useState, useEffect, type CSSProperties } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, ArrowLeft, Tag, Package, ZoomIn, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatGrade, formatPrice } from '@/lib/utils'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { WishlistButton } from '@/components/wishlist-button'
import { BackInStockButton } from '@/components/back-in-stock-button'
import { ProductReviews } from '@/components/reviews'
import { useToast } from '@/components/admin/toast'
import { useCart } from '@/lib/cart-context'
import type { Product } from '@/lib/products'
import { variantLabel, conditionLabel, conditionColor } from '@/lib/conditions'

/** A variant row as returned by /api/products/[id]. */
interface Variant {
  id: string
  condition: string
  foil: string | null
  price: number
  stock: number
  active: boolean
}
/** Local product shape with the variants array attached. */
type ProductWithVariants = Product & { variants?: Variant[] }

// ── Related Products Card ──────────────────────────────────────────────────
function RelatedProductCard({ product, index }: { product: Product; index: number }) {
  const { addToCart } = useCart()
  const toast = useToast()
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    addToCart(product)
    setAdded(true)
    toast.success(`${product.name} added to cart`)
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
      <Link href={`/products/${product.slug ?? product.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
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
          {formatGrade(product.grade, product.grader) && (
            <span style={{
              position: 'absolute', top: '10px', right: '10px',
              background: '#000', color: '#EC1E79',
              padding: '0.2rem 0.6rem', borderRadius: '6px',
              fontSize: '0.6875rem', fontWeight: 700,
            }}>
              {formatGrade(product.grade, product.grader)}
            </span>
          )}
        </div>
      </Link>

      <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Link href={`/products/${product.slug ?? product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
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
            {formatPrice(product.price)}
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
    <div className="product-layout" style={{ display: 'flex', gap: '3rem', padding: '3rem 0', flexWrap: 'wrap' }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0 }
          100% { background-position: -200% 0 }
        }
      `}</style>
      {/* Left — reuse .product-left so the global <768 media query collapses
          this to full-width and prevents the 588px+ min-width overflow on phones. */}
      <div className="product-left" style={{ flex: '0 0 60%', minWidth: 0 }}>
        <SkeletonBlock width="100%" height={440} radius={18} />
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          {[...Array(4)].map((_, i) => <SkeletonBlock key={i} width={80} height={80} radius={10} />)}
        </div>
      </div>
      {/* Right */}
      <div className="product-right" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
  const toast = useToast()
  const [product, setProduct] = useState<ProductWithVariants | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeImage, setActiveImage] = useState(0)
  const [zoomOpen, setZoomOpen] = useState(false)
  const [added, setAdded] = useState(false)
  // null when product has no variants. Otherwise the currently-selected
  // ProductVariant.id (defaults to the first active variant with stock).
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)

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
          // Auto-select the first usable variant: in-stock > active > first.
          const variants: Variant[] = Array.isArray(data.variants) ? data.variants : []
          if (variants.length > 0) {
            const preferred =
              variants.find(v => v.active && v.stock > 0) ||
              variants.find(v => v.active) ||
              variants[0]
            setSelectedVariantId(preferred.id)
          }
        } else if (data?.error) {
          setNotFound(true)
        }
        setLoading(false)
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [id])

  // Derived selection — undefined if the product has no variants at all.
  const variants: Variant[] = product?.variants ?? []
  const hasVariants = variants.length > 0
  const selectedVariant = hasVariants
    ? variants.find(v => v.id === selectedVariantId) ?? variants[0]
    : null
  /** Display price for the buy box — variant price when picked, else product price. */
  const effectivePrice = selectedVariant?.price ?? product?.price ?? 0
  /** Effective stock — variant stock when picked, else product stock. */
  const effectiveStock = selectedVariant?.stock ?? product?.stock ?? 0
  /** Cart helper options for the current selection. */
  const cartOpts = selectedVariant
    ? { variantId: selectedVariant.id, variantStock: selectedVariant.stock }
    : undefined
  const canAdd = product ? canAddMore(product, cartOpts) : false

  useEffect(() => {
    if (product) {
      document.title = `${product.name} | Luton Cards`
    }
  }, [product])

  const handleAddToCart = () => {
    if (!product) return
    if (hasVariants && !selectedVariant) return
    if (!canAddMore(product, cartOpts)) return
    if (selectedVariant) {
      addToCart(product, {
        variantId: selectedVariant.id,
        variantPrice: selectedVariant.price,
        variantLabel: variantLabel(selectedVariant.condition, selectedVariant.foil),
        variantStock: selectedVariant.stock,
      })
    } else {
      addToCart(product)
    }
    setAdded(true)
    toast.success(`${product.name} added to cart`)
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
    ? effectiveStock === 0
      ? { label: 'Sold Out', color: '#ef4444', bg: '#fef2f2' }
      : effectiveStock <= 3
        ? { label: `Low Stock (${effectiveStock} left)`, color: '#f59e0b', bg: '#fffbeb' }
        : { label: `In Stock (${effectiveStock} available)`, color: '#10b981', bg: '#ecfdf5' }
    : null

  const showPrev = () => setActiveImage(i => (i - 1 + images.length) % images.length)
  const showNext = () => setActiveImage(i => (i + 1) % images.length)

  // Keyboard control for the zoom viewer: Esc closes, arrows page through
  // images. Also lock body scroll while it's open.
  useEffect(() => {
    if (!zoomOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomOpen(false)
      else if (e.key === 'ArrowLeft' && images.length > 1) showPrev()
      else if (e.key === 'ArrowRight' && images.length > 1) showNext()
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomOpen, images.length])

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
                          onClick={() => setZoomOpen(true)}
                          initial={{ opacity: 0, scale: 0.97 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 1.02 }}
                          transition={{ duration: 0.25 }}
                          style={{
                            width: '100%', height: '100%',
                            aspectRatio: '4/3',
                            objectFit: 'contain', padding: '1.5rem',
                            cursor: 'zoom-in',
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

                    {/* Zoom hint — click the image to open the full-size viewer */}
                    {images.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setZoomOpen(true)}
                        aria-label="Zoom in"
                        style={{
                          position: 'absolute', bottom: '0.85rem', right: '0.85rem',
                          display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                          background: 'rgba(17,17,17,0.72)', color: '#fff',
                          border: 'none', borderRadius: '9999px',
                          padding: '0.4rem 0.7rem', fontSize: '0.75rem', fontWeight: 700,
                          cursor: 'zoom-in', backdropFilter: 'blur(4px)',
                        }}
                      >
                        <ZoomIn size={14} /> Zoom
                      </button>
                    )}
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
                  {/* Scalar condition pill — only for ungraded singles that
                      don't drive condition through a variant selector. */}
                  {!product.grade && !hasVariants && product.condition && (
                    <span style={{
                      background: `${conditionColor(product.condition)}1a`,
                      border: `1.5px solid ${conditionColor(product.condition)}`,
                      color: conditionColor(product.condition),
                      padding: '0.3rem 0.85rem', borderRadius: '9999px',
                      fontSize: '0.8125rem', fontWeight: 800,
                      letterSpacing: '0.03em',
                    }}>
                      {conditionLabel(product.condition)}
                    </span>
                  )}
                  {/* Collector card number — handy for buyers who search/know
                      a card by its number. */}
                  {product.cardNumber && (
                    <span style={{
                      background: '#f3f4f6', color: '#374151',
                      padding: '0.3rem 0.85rem', borderRadius: '9999px',
                      fontSize: '0.8125rem', fontWeight: 700,
                    }}>
                      No. {product.cardNumber}
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
                  {product.comparePrice && product.comparePrice > effectivePrice && (
                    <p style={{
                      fontSize: '1rem', color: '#9ca3af',
                      textDecoration: 'line-through', margin: '0 0 0.2rem',
                      fontWeight: 500,
                    }}>
                      {formatPrice(product.comparePrice)}
                    </p>
                  )}
                  <p style={{
                    fontSize: '2.25rem', fontWeight: 900, color: '#EC1E79',
                    margin: 0, letterSpacing: '-0.03em', lineHeight: 1,
                  }}>
                    {formatPrice(effectivePrice)}
                  </p>
                  {hasVariants && selectedVariant && (
                    <p style={{ margin: '0.45rem 0 0', fontSize: '0.8125rem', color: '#6b7280', fontWeight: 600 }}>
                      {variantLabel(selectedVariant.condition, selectedVariant.foil)}
                    </p>
                  )}
                </div>

                {/* Variant selector — only shown when the product has variants. */}
                {hasVariants && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <p style={{
                      fontSize: '0.6875rem', fontWeight: 800, color: '#6b7280',
                      letterSpacing: '0.14em', textTransform: 'uppercase',
                      margin: '0 0 0.6rem',
                    }}>
                      Condition
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {variants.map(v => {
                        const isSelected = v.id === selectedVariant?.id
                        const sold = v.stock === 0
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => setSelectedVariantId(v.id)}
                            disabled={sold}
                            style={{
                              padding: '0.55rem 0.95rem',
                              borderRadius: '10px',
                              border: '1.5px solid',
                              borderColor: isSelected ? '#EC1E79' : '#e5e7eb',
                              background: isSelected ? '#EC1E79' : sold ? '#f5f5f5' : '#fff',
                              color: isSelected ? '#fff' : sold ? '#9ca3af' : '#111',
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              letterSpacing: '-0.01em',
                              cursor: sold ? 'not-allowed' : 'pointer',
                              textDecoration: sold ? 'line-through' : 'none',
                              transition: 'all 0.15s',
                              boxShadow: isSelected ? '0 6px 18px -8px rgba(236,30,121,0.55)' : 'none',
                            }}
                          >
                            {variantLabel(v.condition, v.foil)}
                            {sold && (
                              <span style={{ marginLeft: 6, fontSize: '0.7rem', fontWeight: 600 }}>· Sold out</span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

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
                  disabled={!canAdd || added}
                  whileHover={canAdd && !added ? { scale: 1.02 } : {}}
                  whileTap={canAdd && !added ? { scale: 0.97 } : {}}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '0.6rem',
                    background: added
                      ? '#c81c6b'
                      : !canAdd
                        ? '#e5e7eb'
                        : '#EC1E79',
                    color: !canAdd ? '#9ca3af' : '#000',
                    border: 'none',
                    cursor: !canAdd ? 'not-allowed' : 'pointer',
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
                    : effectiveStock === 0
                      ? 'Sold Out'
                      : !canAdd
                        ? 'Max in Cart'
                        : 'Add to Cart'}
                </motion.button>

                {/* Save to wishlist */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <WishlistButton productId={product.id} variant="inline" />
                </div>

                {/* Back-in-stock subscribe (only when sold out). Variant-
                    backed products subscribe at product level — coarse but
                    acceptable until back-in-stock grows variant awareness. */}
                {effectiveStock === 0 && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <BackInStockButton productId={product.id} />
                  </div>
                )}
                {effectiveStock > 0 && effectiveStock <= 10 && (
                  <p style={{ fontSize: '0.8125rem', color: '#f59e0b', marginTop: '0.5rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                    Only {effectiveStock} in stock
                    {cartQuantity(product.id, selectedVariant?.id) > 0 && ` · ${cartQuantity(product.id, selectedVariant?.id)} already in your cart`}
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

        {/* Reviews — shown when product is loaded */}
        {product && (
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem' }}>
            <ProductReviews productId={product.id} />
          </div>
        )}

        {/* Related products — only shown when the current product is loaded */}
        {product && (
          <RelatedProductsSection currentId={product.id} category={product.category} />
        )}
      </main>

      {/* ── Full-screen image viewer (click image / Zoom) ── */}
      <AnimatePresence>
        {zoomOpen && images.length > 0 && product && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setZoomOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '2.5rem 1rem',
            }}
          >
            {/* Close */}
            <button
              type="button"
              onClick={() => setZoomOpen(false)}
              aria-label="Close"
              style={{
                position: 'absolute', top: '1rem', right: '1rem',
                width: 44, height: 44, borderRadius: '50%',
                background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}
            >
              <X size={22} />
            </button>

            {/* Prev / Next when there are multiple angles */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); showPrev() }}
                  aria-label="Previous image"
                  style={navArrowStyle('left')}
                >
                  <ChevronLeft size={26} />
                </button>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); showNext() }}
                  aria-label="Next image"
                  style={navArrowStyle('right')}
                >
                  <ChevronRight size={26} />
                </button>
              </>
            )}

            {/* The image — clicking it does not close (so users can pan/inspect) */}
            <motion.img
              key={activeImage}
              src={images[activeImage]}
              alt={product.name}
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              style={{
                maxWidth: '92vw', maxHeight: '85vh',
                objectFit: 'contain', cursor: 'zoom-out',
                borderRadius: 12, boxShadow: '0 30px 80px -20px rgba(0,0,0,0.7)',
              }}
            />

            {/* Counter */}
            {images.length > 1 && (
              <div style={{
                position: 'absolute', bottom: '1.25rem', left: '50%', transform: 'translateX(-50%)',
                color: 'rgba(255,255,255,0.85)', fontSize: '0.8rem', fontWeight: 700,
                background: 'rgba(255,255,255,0.1)', padding: '0.3rem 0.8rem', borderRadius: '9999px',
              }}>
                {activeImage + 1} / {images.length}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  )
}

function navArrowStyle(side: 'left' | 'right'): CSSProperties {
  return {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
    [side]: '1rem',
    width: 48, height: 48, borderRadius: '50%',
    background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  }
}
