/**
 * Payment provider abstraction.
 *
 * Mirrors the lib/storage pattern: one interface, a driver per gateway,
 * selected by the PAYMENT_PROVIDER env var. Adding Square is then a
 * drop-in — implement lib/payments/square.ts and flip the env var, with
 * zero changes to /api/checkout, /api/orders, or the schema.
 *
 *   PAYMENT_PROVIDER=stripe  (default) → StripeDriver
 *   PAYMENT_PROVIDER=square            → SquareDriver
 *
 * The driver's only job is to turn a server-validated Order into a hosted
 * checkout URL + a provider reference id. ALL pricing has already been
 * recomputed and frozen onto the Order + OrderItems server-side (see
 * /api/orders), so a driver must never trust client input — it reads the
 * Order it is given.
 */

export interface CheckoutLineItem {
  name: string
  /** unit price in major currency units (GBP), e.g. 12.50 */
  unitPrice: number
  quantity: number
  productId?: string | null
}

/** The minimal Order shape a driver needs. Structural so we don't couple
 *  every driver to the full Prisma type. */
export interface CheckoutOrder {
  id: string
  email: string
  name: string
  total: number
  shippingCost: number | null
  shippingMethod: string | null
  discountCode: string | null
  discountAmount: number | null
  items: {
    productName: string
    price: number
    quantity: number
    productId: string | null
    variantCondition?: string | null
    variantFoil?: string | null
  }[]
}

export interface CheckoutResult {
  /** Hosted checkout URL to redirect the buyer to. */
  url: string
  /** Provider session/payment id — persisted as Order.paymentRef. */
  ref: string
}

export interface PaymentDriver {
  /** 'stripe' | 'square' — persisted as Order.paymentProvider. */
  readonly name: string
  /** Create a hosted checkout session for the given (already validated) order. */
  createCheckout(order: CheckoutOrder): Promise<CheckoutResult>
}

let _driver: PaymentDriver | null = null

/**
 * Returns the active payment driver. Lazily constructed + cached. Throws a
 * clear error if PAYMENT_PROVIDER names an unknown gateway.
 */
export function paymentProvider(): PaymentDriver {
  if (_driver) return _driver

  const name = (process.env.PAYMENT_PROVIDER || 'stripe').toLowerCase()
  switch (name) {
    case 'square': {
      // Lazy require so the Square SDK never loads unless selected.
      const { SquareDriver } = require('./square') as typeof import('./square')
      _driver = new SquareDriver()
      return _driver
    }
    case 'stripe':
    default: {
      const { StripeDriver } = require('./stripe') as typeof import('./stripe')
      _driver = new StripeDriver()
      return _driver
    }
  }
}

/** Build the line items a driver renders from an order — shipping + discount
 *  are handled by each driver (Stripe coupons vs Square discounts differ). */
export function orderLineItems(order: CheckoutOrder): CheckoutLineItem[] {
  return order.items.map(item => {
    const condition = [item.variantCondition, item.variantFoil].filter(Boolean).join(' ')
    return {
      name: condition ? `${item.productName} (${condition})` : item.productName,
      unitPrice: item.price,
      quantity: item.quantity,
      productId: item.productId,
    }
  })
}
