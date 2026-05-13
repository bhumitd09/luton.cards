'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import type { Product } from './products'

export interface CartItem {
  product: Product
  quantity: number
}

interface CartContextType {
  items: CartItem[]
  addToCart: (product: Product) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
  cartQuantity: (productId: string) => number
  canAddMore: (product: Product) => boolean
  liveStock: Record<string, number>
  refreshStock: () => Promise<void>
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [liveStock, setLiveStock] = useState<Record<string, number>>({})
  const [hydrated, setHydrated] = useState(false)

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
          if (maxStock === 0) return item // keep in cart, just disabled
          if (item.quantity > maxStock) return { ...item, quantity: maxStock }
          return item
        })
      )
    } catch {
      // fail silently — fall back to cached stock
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
        // Fetch live stock for everything in the cart
        const ids = parsed.map(i => i.product.id).filter(Boolean)
        if (ids.length > 0) {
          fetch(`/api/products/stock?ids=${ids.join(',')}`)
            .then(r => r.ok ? r.json() : {})
            .then((data: Record<string, number>) => {
              setLiveStock(data)
              // Clamp quantities to live stock
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
  }, [])

  // Persist to localStorage whenever items change (after hydration)
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem('luton-cart', JSON.stringify(items))
    }
  }, [items, hydrated])

  // Get the live stock for a product, falling back to the cached value
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

  const clearCart = () => setItems([])

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0)

  const cartQuantity = (productId: string) =>
    items.find(i => i.product.id === productId)?.quantity ?? 0

  const canAddMore = (product: Product) => {
    const maxStock = getStock(product)
    return maxStock > 0 && cartQuantity(product.id) < maxStock
  }

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
      cartQuantity,
      canAddMore,
      liveStock,
      refreshStock,
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
