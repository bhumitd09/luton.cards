'use client'

import { useEffect, useState, MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Heart } from 'lucide-react'
import { motion } from 'framer-motion'

type Size = 'sm' | 'md' | 'lg'

export function WishlistButton({
  productId,
  size = 'md',
  variant = 'overlay',
}: {
  productId: string
  size?: Size
  variant?: 'overlay' | 'inline'
}) {
  const router = useRouter()
  const [inWishlist, setInWishlist] = useState<boolean | null>(null)
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [tooltip, setTooltip] = useState<string | null>(null)

  // Fetch current state on mount
  useEffect(() => {
    let cancelled = false
    fetch(`/api/account/wishlist/${productId}`, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : { inWishlist: false, authenticated: false })
      .then(data => {
        if (cancelled) return
        setInWishlist(!!data.inWishlist)
        setAuthenticated(!!data.authenticated)
      })
      .catch(() => {
        if (cancelled) return
        setInWishlist(false)
      })
    return () => { cancelled = true }
  }, [productId])

  const handleClick = async (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!authenticated) {
      // Redirect to login, then come back here after
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`)
      return
    }

    setLoading(true)
    try {
      if (inWishlist) {
        await fetch(`/api/account/wishlist/${productId}`, { method: 'DELETE' })
        setInWishlist(false)
        setTooltip('Removed from wishlist')
      } else {
        await fetch('/api/account/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId }),
        })
        setInWishlist(true)
        setTooltip('Added to wishlist')
      }
      setTimeout(() => setTooltip(null), 1500)
    } catch {
      setTooltip('Could not update')
      setTimeout(() => setTooltip(null), 1500)
    } finally {
      setLoading(false)
    }
  }

  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 15
  const buttonSize = size === 'sm' ? 28 : size === 'lg' ? 40 : 32

  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={loading || inWishlist === null}
        className={[
          'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold transition-all',
          inWishlist
            ? 'bg-[#fff0f7] text-[#EC1E79] border border-[#EC1E79]'
            : 'bg-white border border-neutral-200 text-neutral-700 hover:border-[#EC1E79] hover:text-[#EC1E79]',
        ].join(' ')}
      >
        <Heart size={14} fill={inWishlist ? '#EC1E79' : 'none'} />
        {inWishlist ? 'Saved' : 'Save'}
      </button>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <motion.button
        type="button"
        onClick={handleClick}
        disabled={loading || inWishlist === null}
        whileTap={{ scale: 0.85 }}
        aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        title={authenticated === false ? 'Sign in to save' : inWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
        style={{
          width: buttonSize, height: buttonSize, borderRadius: '50%',
          background: inWishlist ? '#EC1E79' : 'rgba(255,255,255,0.95)',
          color: inWishlist ? '#fff' : '#EC1E79',
          border: '1px solid',
          borderColor: inWishlist ? '#EC1E79' : 'rgba(0,0,0,0.08)',
          backdropFilter: 'blur(4px)',
          cursor: loading || inWishlist === null ? 'wait' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 0,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          opacity: inWishlist === null ? 0.5 : 1,
          transition: 'background 0.2s, color 0.2s, border-color 0.2s',
        }}
      >
        <Heart size={iconSize} fill={inWishlist ? '#fff' : 'none'} strokeWidth={2.2} />
      </motion.button>
      {tooltip && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: 'absolute', top: '100%', right: 0, marginTop: 6,
            padding: '4px 10px', borderRadius: 6,
            background: '#111', color: '#fff',
            fontSize: '0.7rem', fontWeight: 700,
            whiteSpace: 'nowrap', zIndex: 10,
            pointerEvents: 'none',
          }}
        >
          {tooltip}
        </motion.div>
      )}
    </div>
  )
}
