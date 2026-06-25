'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import type { Product } from './products'
import { track } from './analytics'

/**
 * Cart items can now be variant-backed (Near Mint Holofoil, Damaged Normal,
 * etc.). Each cart line is keyed by `${productId}|${variantId || ''}` so the
 * same product in two different conditions occupies two cart lines.
 *
 * Backward compatible — items persisted before variants existed have
 * `variantId === undefined` and behave exactly as before, using
 * product.price / product.stock.
 */
export interface CartItem {
  product: Product
  quantity: number
  /** ProductVariant.id when the buyer picked a condition. */
  variantId?: string
  /** Snapshot at add-to-cart time so the line stays priced consistently
   *  even if the live variant price moves before checkout. */
  variantPrice?: number
  /** Display label e.g. "Moderately Played Holofoil". */
  variantLabel?: string
  /** Live variant stock snapshot when added — refreshed by refreshStock. */
  variantStock?: number
}

export interface AppliedDiscount {
  code: string
  savings: number     // absolute £ amount deducted from subtotal
  type: 'percentage' | 'fixed'
  value: number       // raw percent or £ amount of the discount
  reason?: string
}

interface ApplyResult {
  ok: boolean
  reason?: string
}

interface AddToCartOptions {
  variantId?: string
  variantPrice?: number
  variantLabel?: string
  variantStock?: number
}

interface CartContextType {
  items: CartItem[]
  /**
   * Add a product to the cart. Pass `opts` when adding a specific variant
   * (condition). Items are keyed by (productId, variantId), so the same
   * product in two conditions occupies two lines.
   */
  addToCart: (product: Product, opts?: AddToCartOptions) => void
  removeFromCart: (productId: string, variantId?: string) => void
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number              // subtotal (before discount)
  discountedTotal: number         // subtotal − discount.savings
  /** Total quantity of a (product, variant) pair in the cart. */
  cartQuantity: (productId: string, variantId?: string) => number
  /** Can the user still add one more of this (product, variant)? */
  canAddMore: (product: Product, opts?: { variantId?: string; variantStock?: number }) => boolean
  liveStock: Record<string, number>
  refreshStock: () => Promise<void>
  // Discount
  discount: AppliedDiscount | null
  applyDiscount: (code: string) => Promise<ApplyResult>
  removeDiscount: () => void
}

const CartContext = createContext<CartContextType | null>(null)

/** Composite key for variant-aware item lookups. */
function itemKey(productId: string, variantId?: string): string {
  return `${productId}|${variantId ?? ''}`
}

/** Stock-table key — variant stock lives at `${productId}:${variantId}`. */
function stockKey(productId: string, variantId?: string): string {
  return variantId ? `${productId}:${variantId}` : productId
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  // Map of (productId or productId:variantId) → live remaining stock.
  const [liveStock, setLiveStock] = useState<Record<string, number>>({})
  const [hydrated, setHydrated] = useState(false)
  const [discount, setDiscount] = useState<AppliedDiscount | null>(null)

  // Helper: read the price for a cart line — variant snapshot wins.
  const linePrice = (item: CartItem): number =>
    item.variantPrice ?? item.product.price

  // Helper: read the most authoritative stock value we have for an item.
  const itemStock = (item: CartItem): number => {
    const k = stockKey(item.product.id, item.variantId)
    if (liveStock[k] !== undefined) return liveStock[k]
    if (item.variantStock !== undefined) return item.variantStock
    return item.product.stock
  }

  // Fetch fresh stock from the API for all (product, variant) pairs in cart.
  const refreshStock = useCallback(async (cartItems?: CartItem[]) => {
    const target = cartItems ?? items
    if (target.length === 0) return
    // Build query: ids=<productId>,<productId>:<variantId>,...
    const ids = Array.from(new Set(target.map(i => stockKey(i.product.id, i.variantId))))
    try {
      const res = await fetch(`/api/products/stock?ids=${ids.map(encodeURIComponent).join(',')}`)
      if (!res.ok) return
      const data: Record<string, number> = await res.json()
      setLiveStock(data)

      // Auto-correct any quantities that now exceed live stock
      setItems(prev =>
        prev.map(item => {
          const max = data[stockKey(item.product.id, item.variantId)] ?? 0
          if (max === 0) return item
          if (item.quantity > max) return { ...item, quantity: max }
          return item
        })
      )
    } catch {
      // fail silently
    }
  }, [items])

  // Hydrate from localStorage then immediately validate stock
  useEffect(() => {
    const saved = localStorage.getItem('luton-cart')
    if (saved) {
      try {
        const parsed: CartItem[] = JSON.parse(saved)
        setItems(parsed)
        setHydrated(true)
        if (parsed.length > 0) {
          const ids = Array.from(new Set(parsed.map(i => stockKey(i.product.id, i.variantId))))
          fetch(`/api/products/stock?ids=${ids.map(encodeURIComponent).join(',')}`)
            .then(r => r.ok ? r.json() : {})
            .then((data: Record<string, number>) => {
              setLiveStock(data)
              setItems(prev =>
                prev.map(item => {
                  const max = data[stockKey(item.product.id, item.variantId)]
                    ?? item.variantStock
                    ?? item.product.stock
                  if (max === 0) return item
                  if (item.quantity > max) return { ...item, quantity: max }
                  return item
                })
              )
            })
            .catch(() => {})
        }
      } catch {
        setHydrated(true)
      }
    } else {
      setHydrated(true)
    }

    // Hydrate saved discount (if any)
    const savedDiscount = localStorage.getItem('luton-discount')
    if (savedDiscount) {
      try {
        const parsed = JSON.parse(savedDiscount) as AppliedDiscount
        if (parsed && parsed.code) setDiscount(parsed)
      } catch {}
    }
  }, [])

  // Persist cart
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem('luton-cart', JSON.stringify(items))
    }
  }, [items, hydrated])

  // Persist discount
  useEffect(() => {
    if (!hydrated) return
    if (discount) {
      localStorage.setItem('luton-discount', JSON.stringify(discount))
    } else {
      localStorage.removeItem('luton-discount')
    }
  }, [discount, hydrated])

  const addToCart = (product: Product, opts?: AddToCartOptions) => {
    const variantId = opts?.variantId
    const k = itemKey(product.id, variantId)
    const sKey = stockKey(product.id, variantId)
    const maxStock = liveStock[sKey] !== undefined
      ? liveStock[sKey]
      : opts?.variantStock !== undefined
        ? opts.variantStock
        : product.stock

    setItems(prev => {
      const existing = prev.find(i => itemKey(i.product.id, i.variantId) === k)
      if (existing) {
        if (existing.quantity >= maxStock) return prev
        return prev.map(i =>
          itemKey(i.product.id, i.variantId) === k
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      if (maxStock <= 0) return prev
      return [...prev, {
        product,
        quantity: 1,
        variantId,
        variantPrice: opts?.variantPrice,
        variantLabel: opts?.variantLabel,
        variantStock: opts?.variantStock,
      }]
    })

    track('product_added_to_cart', {
      product_id: product.id,
      product_name: product.name,
      price: opts?.variantPrice ?? product.price,
      variant: opts?.variantLabel,
      game: product.game,
    })
  }

  const removeFromCart = (productId: string, variantId?: string) => {
    const k = itemKey(productId, variantId)
    setItems(prev => prev.filter(i => itemKey(i.product.id, i.variantId) !== k))
  }

  const updateQuantity = (productId: string, quantity: number, variantId?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantId)
      return
    }
    const k = itemKey(productId, variantId)
    setItems(prev =>
      prev.map(i => {
        if (itemKey(i.product.id, i.variantId) !== k) return i
        const max = itemStock(i)
        return { ...i, quantity: Math.min(quantity, max) }
      })
    )
  }

  const clearCart = () => {
    setItems([])
    setDiscount(null)
  }

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = items.reduce((sum, i) => sum + linePrice(i) * i.quantity, 0)
  const discountedTotal = Math.max(0, totalPrice - (discount?.savings ?? 0))

  const cartQuantity = (productId: string, variantId?: string) => {
    const k = itemKey(productId, variantId)
    return items.find(i => itemKey(i.product.id, i.variantId) === k)?.quantity ?? 0
  }

  const canAddMore = (product: Product, opts?: { variantId?: string; variantStock?: number }) => {
    const sKey = stockKey(product.id, opts?.variantId)
    const max = liveStock[sKey] !== undefined
      ? liveStock[sKey]
      : opts?.variantStock !== undefined
        ? opts.variantStock
        : product.stock
    return max > 0 && cartQuantity(product.id, opts?.variantId) < max
  }

  // ── Discount handlers ────────────────────────────────────────────────────

  const applyDiscount = useCallback(async (code: string): Promise<ApplyResult> => {
    const trimmed = code.trim()
    if (!trimmed) return { ok: false, reason: 'Enter a code' }
    try {
      const res = await fetch(
        `/api/discounts/validate?code=${encodeURIComponent(trimmed)}&total=${totalPrice.toFixed(2)}`,
      )
      const data = await res.json()
      if (!data.valid) {
        return { ok: false, reason: data.reason || 'Invalid code' }
      }
      setDiscount({
        code: trimmed.toUpperCase(),
        savings: Number(data.savings) || 0,
        type: data.type,
        value: Number(data.value) || 0,
      })
      return { ok: true }
    } catch {
      return { ok: false, reason: 'Could not validate code. Try again.' }
    }
  }, [totalPrice])

  const removeDiscount = () => setDiscount(null)

  // Re-validate discount when cart totals change (in case minOrder no longer met)
  useEffect(() => {
    if (!discount) return
    if (totalPrice === 0) {
      setDiscount(null)
      return
    }
    fetch(`/api/discounts/validate?code=${encodeURIComponent(discount.code)}&total=${totalPrice.toFixed(2)}`)
      .then(r => r.json())
      .then(data => {
        if (!data.valid) {
          setDiscount(null)
        } else if (Math.abs(Number(data.savings) - discount.savings) > 0.01) {
          setDiscount(prev => prev ? { ...prev, savings: Number(data.savings) || 0 } : null)
        }
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPrice])

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
      discountedTotal,
      cartQuantity,
      canAddMore,
      liveStock,
      refreshStock,
      discount,
      applyDiscount,
      removeDiscount,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
