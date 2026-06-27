'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, useInView, useMotionValue, useMotionTemplate } from 'framer-motion'
import { ShoppingCart, ArrowRight, Package } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { BorderBeam } from '@/components/magicui/border-beam'
import { WishlistButton } from '@/components/wishlist-button'
import { formatGrade, formatPrice } from '@/lib/utils'
import type { Product } from '@/lib/products'
import { conditionShort, conditionLabel, conditionColor } from '@/lib/conditions'

const MAX_FEATURED = 6

function ProductCard({ product, index, featured }: { product: Product; index: number; featured: boolean }) {
  const { addToCart, canAddMore } = useCart()
  const [added, setAdded] = useState(false)
  const [hovered, setHovered] = useState(false)
  const cardRef = useRef<HTMLAnchorElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const spotlightBg = useMotionTemplate`radial-gradient(220px circle at ${mouseX}px ${mouseY}px, rgba(236,30,121,0.10), transparent 70%)`

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left)
    mouseY.set(e.clientY - rect.top)
  }

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    addToCart(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1400)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
    >
      <Link
        ref={cardRef}
        href={`/products/${product.slug ?? product.id}`}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-shadow duration-300 hover:shadow-[0_22px_50px_-22px_rgba(236,30,121,0.35)]"
      >
        {/* spotlight */}
        <motion.div
          style={{ background: spotlightBg }}
          className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
        />

        {/* image */}
        <div className="relative z-[1] flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-gradient-to-br from-neutral-50 to-neutral-100">
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image}
              alt={product.name}
              className="aspect-[4/3] size-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-neutral-300">
              <Package size={42} strokeWidth={1.4} />
              <span className="text-[10px] font-bold uppercase tracking-[0.14em]">No image</span>
            </div>
          )}

          {/* corner badges */}
          {formatGrade(product.grade, product.grader) && (
            <span className="absolute left-2.5 top-2.5 rounded-md bg-black px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#EC1E79]">
              {formatGrade(product.grade, product.grader)}
            </span>
          )}
          {/* Top-right badge priority: condition (non-graded) > stock state */}
          {!product.grade && product.condition ? (
            <span
              className="absolute right-2.5 top-2.5 rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white"
              style={{ background: conditionColor(product.condition) }}
            >
              {conditionShort(product.condition)}
            </span>
          ) : product.stock === 0 ? (
            <span className="absolute right-2.5 top-2.5 rounded-md bg-red-500 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
              Sold out
            </span>
          ) : product.stock <= 2 ? (
            <span className="absolute right-2.5 top-2.5 rounded-md bg-black/75 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
              {product.stock} left
            </span>
          ) : null}

          {/* Wishlist heart — top-right when no top-right badge, otherwise just below it */}
          <div
            className="absolute z-10"
            style={{ top: (!product.grade && product.condition) || product.stock <= 2 ? '36px' : '10px', right: '10px' }}
          >
            <WishlistButton productId={product.id} size="sm" />
          </div>
        </div>

        {/* body */}
        <div className="relative z-[1] flex flex-1 flex-col p-3.5">
          <p className="m-0 mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-400">
            <span className="size-1 rounded-full bg-[#EC1E79]" />
            {product.game === 'one-piece' ? 'One Piece' : 'Pokémon'} · {product.category}
            {!product.grade && product.condition && (
              <span
                className="ml-auto rounded px-1.5 py-0.5 text-[10px] font-bold normal-case tracking-normal"
                style={{
                  background: `${conditionColor(product.condition)}1a`,
                  color: conditionColor(product.condition),
                }}
              >
                {conditionLabel(product.condition)}
              </span>
            )}
          </p>
          <h3 className="m-0 mb-auto line-clamp-2 text-sm font-bold leading-snug text-neutral-900">
            {product.name}
          </h3>
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-neutral-100 pt-3">
            <span className="text-lg font-black tracking-tight text-[#EC1E79]">
              {formatPrice(product.price)}
            </span>
            <motion.button
              onClick={handleAdd}
              disabled={!canAddMore(product) || added || product.stock === 0}
              whileTap={{ scale: 0.96 }}
              className={[
                'inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-extrabold transition-colors',
                added
                  ? 'bg-emerald-500 text-white'
                  : product.stock === 0 || !canAddMore(product)
                  ? 'cursor-not-allowed bg-neutral-100 text-neutral-400'
                  : 'bg-neutral-900 text-white hover:bg-[#EC1E79]',
              ].join(' ')}
            >
              <ShoppingCart size={12} />
              {added
                ? 'Added'
                : product.stock === 0
                ? 'Sold'
                : !canAddMore(product)
                ? 'Max'
                : 'Add'}
            </motion.button>
          </div>
        </div>

        {/* border beam for featured */}
        {featured && hovered && (
          <BorderBeam size={300} duration={10} colorFrom="#EC1E79" colorTo="#FF80B8" borderWidth={1.5} />
        )}
      </Link>
    </motion.div>
  )
}

export function FeaturedProducts() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/products?featured=true')
      .then(r => r.json())
      .then(data => {
        const all = (Array.isArray(data) ? data : []).filter((p: Product) => p.featured)
        // Shuffle so that when more than 6 cards are featured, a different
        // mix surfaces on every visit/refresh instead of always the first 6.
        // Safe to randomise here — this runs client-side after the loading
        // skeleton, so there's no SSR/hydration mismatch.
        for (let i = all.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[all[i], all[j]] = [all[j], all[i]]
        }
        setProducts(all)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Only your hand-picked featured cards, capped at 6. (Guard client-side too,
  // so even if the API returns extras only featured ones show.)
  const featured = products.filter(p => p.featured).slice(0, MAX_FEATURED)

  return (
    <section ref={ref} className="bg-[#fafafa] py-16 sm:py-20">
      <div className="mx-auto max-w-[1180px] px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.45 }}
          className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end"
        >
          <div>
            <p className="m-0 text-[10px] font-bold uppercase tracking-[0.16em] text-[#EC1E79]">
              Hand-picked
            </p>
            <h2 className="m-0 mt-2 text-[clamp(1.75rem,3.5vw,2.5rem)] font-black tracking-[-0.03em] text-neutral-900">
              Fresh in.
            </h2>
          </div>
          <Link
            href="/products"
            className="hidden shrink-0 items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-bold text-neutral-700 transition-all hover:border-[#EC1E79] hover:text-[#EC1E79] sm:inline-flex"
          >
            Shop all cards <ArrowRight size={14} />
          </Link>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[...Array(MAX_FEATURED)].map((_, i) => (
              <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-neutral-200" />
            ))}
          </div>
        ) : featured.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white py-20 text-center">
            <Package className="mx-auto mb-3 text-neutral-300" size={36} />
            <p className="m-0 text-sm font-bold text-neutral-500">No featured cards yet.</p>
            <p className="m-0 mt-1 text-xs text-neutral-400">
              Star a few products in the back office to feature them here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {featured.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} featured={p.featured} />
            ))}
          </div>
        )}

        {/* Shop all — prominent button so visitors can see the full catalogue. */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.3 }}
          className="mt-10 text-center"
        >
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-full bg-[#EC1E79] px-7 py-3 text-sm font-extrabold text-white shadow-[0_10px_30px_-10px_rgba(236,30,121,0.6)] transition-transform hover:-translate-y-0.5"
          >
            Shop all cards <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
