'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import type { Product } from './products'

export interface CartItem {
  product: Product
  quantity: number
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

interface CartContextType {
  items: CartItem[]
  addToCart: (product: Product) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number              // subtotal (before discount)
  discountedTotal: number         // subtotal − discount.savings
  cartQuantity: (productId: string) => number
  canAddMore: (product: Product) => boolean
  liveStock: Record<string, number>
  refreshStock: () => Promise<void>
  // Discount
  discount: AppliedDiscount | null
  applyDiscount: (code: string) => Promise<ApplyResult>
  removeDiscount: () => void
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [liveStock, setLiveStock] = useState<Record<string, number>>({})
  const [hydrated, setHydrated] = useState(false)
  const [discount, setDiscount] = useState<AppliedDiscount | null>(null)

  // Fetch fresh stock from the API for all items currently in the cart
  const refreshStock = useCallback(async (cartItems?: CartItem[]) => {
    const target = cartItems ?? items
    const ids = target.map(i => i.product.id).filter(Boolean)
    if (ids.length === 0) return

    try {
      const res = await fetch(`/api/products/stock?ids=${ids.join(',')}`)
      if (!res.ok) return
      const data: Record<string, number> = await res.json()
      setLiveStock(data)

      // Auto-correct any quantities that now exceed live stock
      setItems(prev =>
        prev.map(item => {
          const maxStock = data[item.product.id] ?? 0
          if (maxStock === 0) return item
          if (item.quantity > maxStock) return { ...item, quantity: maxStock }
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
        const ids = parsed.map(i => i.product.id).filter(Boolean)
        if (ids.length > 0) {
          fetch(`/api/products/stock?ids=${ids.join(',')}`)
            .then(r => r.ok ? r.json() : {})
            .then((data: Record<string, number>) => {
              setLiveStock(data)
              setItems(prev =>
                prev.map(item => {
                  const maxStock = data[item.product.id] ?? item.product.stock
                  if (maxStock === 0) return item
                  if (item.quantity > maxStock) return { ...item, quantity: maxStock }
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

  const getStock = (product: Product) =>
    liveStock[product.id] !== undefined ? liveStock[product.id] : product.stock

  const addToCart = (product: Product) => {
    const maxStock = liveStock[product.id] !== undefined ? liveStock[product.id] : product.stock
    setItems(prev => {
      const existing = prev.find(i => i.product.id === product.id)
      if (existing) {
        if (existing.quantity >= maxStock) return prev
        return prev.map(i =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      if (maxStock <= 0) return prev
      return [...prev, { product, quantity: 1 }]
    })
  }

  const removeFromCart = (productId: string) => {
    setItems(prev => prev.filter(i => i.product.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setItems(prev =>
      prev.map(i => {
        if (i.product.id !== productId) return i
        const maxStock = liveStock[i.product.id] !== undefined
          ? liveStock[i.product.id]
          : i.product.stock
        return { ...i, quantity: Math.min(quantity, maxStock) }
      })
    )
  }

  const clearCart = () => {
    setItems([])
    setDiscount(null)
  }

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0)
  const discountedTotal = Math.max(0, totalPrice - (discount?.savings ?? 0))

  const cartQuantity = (productId: string) =>
    items.find(i => i.product.id === productId)?.quantity ?? 0

  const canAddMore = (product: Product) => {
    const maxStock = getStock(product)
    return maxStock > 0 && cartQuantity(product.id) < maxStock
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
    // If the cart is empty, drop the discount
    if (totalPrice === 0) {
      setDiscount(null)
      return
    }
    // Re-check from server side. If invalid, drop silently.
    fetch(`/api/discounts/validate?code=${encodeURIComponent(discount.code)}&total=${totalPrice.toFixed(2)}`)
      .then(r => r.json())
      .then(data => {
        if (!data.valid) {
          setDiscount(null)
        } else if (Math.abs(Number(data.savings) - discount.savings) > 0.01) {
          // Recalc savings if e.g. percent discount now applies to different total
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
