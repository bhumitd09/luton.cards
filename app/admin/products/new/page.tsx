'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * /admin/products/new — redirect to the canonical flow.
 *
 * Adding + editing products is now handled by the modal on /admin/products
 * (the "Add Product" button opens it). That modal is the single source of
 * truth: it carries the game selector, condition variants, the current
 * design system and toast/confirm wiring. This standalone page had drifted
 * out of sync (old theme, no variants, no game field) and nothing linked to
 * it, so it now just bounces to the products list where the modal lives.
 */
export default function NewProductRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/admin/products')
  }, [router])
  return null
}
