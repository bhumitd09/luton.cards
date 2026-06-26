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

export interface RefundRequest {
  /** The provider reference stored on the order (Order.paymentRef). For
   *  Stripe this is the Checkout Session id; the driver resolves it to the
   *  underlying PaymentIntent. */
  ref: string
  /** Amount to refund in major currency units (GBP). Omit for a full refund. */
  amount?: number
  /** Optional human reason, surfaced to the gateway where supported. */
  reason?: string
  /** Optional idempotency key — the gateway dedupes retries with the same key
   *  so a double-click / network retry can't issue two refunds. */
  idempotencyKey?: string
}

export interface RefundResult {
  /** Provider refund id. */
  refundId: string
  /** Amount actually refunded, in major currency units (GBP). */
  amount: number
}

export interface PaymentDriver {
  /** 'stripe' | 'square' — persisted as Order.paymentProvider. */
  readonly name: string
  /** Create a hosted checkout session for the given (already validated) order. */
  createCheckout(order: CheckoutOrder): Promise<CheckoutResult>
  /** Refund all or part of a captured payment. */
  refund(req: RefundRequest): Promise<RefundResult>
  /** Re-check a session/payment with the gateway (source of truth) — used by
   *  the success-page reconciliation backstop so a missed webhook can't leave a
   *  paid order stuck pending. Optional; drivers without it skip reconciliation. */
  verifySession?(ref: string): Promise<{ paid: boolean; amountPence: number; ref: string }>
}

/**
 * The only two gateways Luton Cards supports. PAYMENT_PROVIDER must be one of
 * these (defaults to 'stripe'). Anything else is rejected so a typo can't
 * silently fall back to the wrong processor for a money path.
 */
export const SUPPORTED_PROVIDERS = ['stripe', 'square'] as const
export type ProviderName = (typeof SUPPORTED_PROVIDERS)[number]

/** Resolve the configured provider name (validated, lowercased). */
export function activeProviderName(): ProviderName {
  const raw = (process.env.PAYMENT_PROVIDER || 'stripe').toLowerCase()
  return (SUPPORTED_PROVIDERS as readonly string[]).includes(raw) ? (raw as ProviderName) : 'stripe'
}

let _driver: PaymentDriver | null = null

/**
 * Returns the active payment driver. Lazily constructed + cached.
 */
export function paymentProvider(): PaymentDriver {
  if (_driver) return _driver

  switch (activeProviderName()) {
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

/** Per-provider config + readiness, computed from env (NEVER returns secret
 *  values — only booleans). Powers the admin Payments panel. */
export interface ProviderStatus {
  name: ProviderName
  label: string
  active: boolean
  configured: boolean
  /** env var → present? — so the admin sees exactly what's still missing. */
  envVars: { key: string; present: boolean; required: boolean }[]
}

export function paymentProvidersStatus(): ProviderStatus[] {
  const active = activeProviderName()
  const has = (k: string) => Boolean(process.env[k] && process.env[k]!.length > 0)

  const stripeVars = [
    { key: 'STRIPE_SECRET_KEY', present: has('STRIPE_SECRET_KEY'), required: true },
    { key: 'STRIPE_WEBHOOK_SECRET', present: has('STRIPE_WEBHOOK_SECRET'), required: true },
    { key: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', present: has('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'), required: false },
  ]
  const squareVars = [
    { key: 'SQUARE_ACCESS_TOKEN', present: has('SQUARE_ACCESS_TOKEN'), required: true },
    { key: 'SQUARE_LOCATION_ID', present: has('SQUARE_LOCATION_ID'), required: true },
    { key: 'SQUARE_ENVIRONMENT', present: has('SQUARE_ENVIRONMENT'), required: false },
    { key: 'SQUARE_WEBHOOK_SIGNATURE_KEY', present: has('SQUARE_WEBHOOK_SIGNATURE_KEY'), required: true },
  ]

  return [
    {
      name: 'stripe',
      label: 'Stripe',
      active: active === 'stripe',
      configured: stripeVars.filter(v => v.required).every(v => v.present),
      envVars: stripeVars,
    },
    {
      name: 'square',
      label: 'Square',
      active: active === 'square',
      configured: squareVars.filter(v => v.required).every(v => v.present),
      envVars: squareVars,
    },
  ]
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
