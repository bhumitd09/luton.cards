'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, BellOff, Check, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/components/admin/toast'

/**
 * Sits on the PDP only when the product is out of stock.
 * Lets the customer subscribe to be emailed when it's back.
 * Requires login — redirects to /login?next=current-path if not signed in.
 */
export function BackInStockButton({ productId }: { productId: string }) {
  const router = useRouter()
  const toast = useToast()
  const [subscribed, setSubscribed] = useState<boolean | null>(null)
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/products/${productId}/notify`, { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : { subscribed: false, authenticated: false }))
      .then(data => {
        if (cancelled) return
        setSubscribed(!!data.subscribed)
        setAuthenticated(!!data.authenticated)
      })
      .catch(() => setSubscribed(false))
    return () => { cancelled = true }
  }, [productId])

  const handleClick = async () => {
    if (!authenticated) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`)
      return
    }
    setLoading(true)
    try {
      if (subscribed) {
        const res = await fetch(`/api/products/${productId}/notify`, { method: 'DELETE' })
        if (res.ok) {
          setSubscribed(false)
        } else {
          toast.error('Could not update your notification. Please try again.')
        }
      } else {
        const res = await fetch(`/api/products/${productId}/notify`, { method: 'POST' })
        if (res.ok) {
          setSubscribed(true)
          toast.success("You're on the list — we'll email you when it's back in stock.")
        } else {
          toast.error('Could not subscribe. Please try again.')
        }
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (subscribed === null) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-neutral-100 px-4 py-3 text-sm text-neutral-500">
        <Loader2 size={14} className="animate-spin" />
        Loading…
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      {subscribed ? (
        <motion.div
          key="subscribed"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="rounded-xl border border-emerald-300/60 bg-emerald-50 px-4 py-3"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-full bg-emerald-500 text-white">
              <Check size={14} />
            </div>
            <div className="flex-1">
              <p className="m-0 text-[13px] font-extrabold text-emerald-800">You&rsquo;re on the list</p>
              <p className="m-0 text-[11.5px] text-emerald-700/80">We&rsquo;ll email you the moment this is restocked.</p>
            </div>
            <button
              type="button"
              onClick={handleClick}
              disabled={loading}
              className="rounded-lg border border-emerald-300/60 bg-white px-2.5 py-1 text-[11px] font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
              title="Unsubscribe"
            >
              <BellOff size={11} />
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.button
          key="subscribe"
          type="button"
          onClick={handleClick}
          disabled={loading}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#EC1E79] bg-white px-4 py-3 text-[13.5px] font-extrabold text-[#EC1E79] transition-colors hover:bg-[#fff0f7]"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Bell size={14} />}
          {authenticated ? 'Email me when back in stock' : 'Sign in to get notified'}
        </motion.button>
      )}
    </AnimatePresence>
  )
}
