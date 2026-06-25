import Stripe from 'stripe'
import type { CheckoutOrder, CheckoutResult, PaymentDriver, RefundRequest, RefundResult } from './index'
import { orderLineItems } from './index'

/**
 * Stripe payment driver. Holds the real Stripe Checkout logic that used to
 * live inline in /api/stripe/checkout. Pricing comes entirely from the
 * server-validated Order — never from client input.
 *
 * The returned `ref` is the Stripe Checkout session id. The caller persists
 * it as both Order.paymentRef AND Order.stripeSessionId, so the existing
 * Stripe webhook's provenance check (session.id === order.stripeSessionId)
 * keeps working unchanged.
 */
export class StripeDriver implements PaymentDriver {
  readonly name = 'stripe'
  private stripe: Stripe

  constructor() {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
    this.stripe = new Stripe(key, { apiVersion: '2023-08-16' })
  }

  async createCheckout(order: CheckoutOrder): Promise<CheckoutResult> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lutoncards.com'

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = orderLineItems(order).map(li => ({
      price_data: {
        currency: 'gbp',
        product_data: {
          name: li.name,
          metadata: { productId: li.productId || '' },
        },
        unit_amount: Math.round(li.unitPrice * 100), // pence
      },
      quantity: li.quantity,
    }))

    // Server-stored shipping cost as its own line.
    const shippingPence = Math.round((order.shippingCost ?? 0) * 100)
    if (shippingPence > 0) {
      lineItems.push({
        price_data: {
          currency: 'gbp',
          product_data: { name: `Shipping${order.shippingMethod ? ` - ${order.shippingMethod}` : ''}` },
          unit_amount: shippingPence,
        },
        quantity: 1,
      })
    }

    // Discount via a one-off coupon scoped to this session.
    const discounts: Stripe.Checkout.SessionCreateParams['discounts'] = []
    if (order.discountAmount && order.discountAmount > 0 && order.discountCode) {
      const coupon = await this.stripe.coupons.create({
        amount_off: Math.round(order.discountAmount * 100),
        currency: 'gbp',
        name: order.discountCode,
        duration: 'once',
      })
      discounts.push({ coupon: coupon.id })
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      customer_email: order.email,
      metadata: { orderId: order.id, customerName: order.name },
      ...(discounts.length > 0 ? { discounts } : {}),
      // Carry the friendly order number in the return URL so the success page
      // shows "#ABCD1234" immediately — never the raw cs_… session id.
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&ref=${encodeURIComponent(order.id.slice(-8).toUpperCase())}`,
      cancel_url: `${appUrl}/checkout`,
    })

    if (!session.url) throw new Error('Stripe did not return a checkout URL')
    return { url: session.url, ref: session.id }
  }

  async refund(req: RefundRequest): Promise<RefundResult> {
    // The stored ref is a Checkout Session id. Resolve it to the underlying
    // PaymentIntent — that's what Stripe refunds against.
    let paymentIntentId: string | null = null
    if (req.ref.startsWith('pi_')) {
      paymentIntentId = req.ref
    } else if (req.ref.startsWith('cs_')) {
      const session = await this.stripe.checkout.sessions.retrieve(req.ref)
      paymentIntentId = typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id ?? null
    }
    if (!paymentIntentId) {
      throw new Error('Could not resolve a Stripe payment to refund for this order.')
    }

    const refund = await this.stripe.refunds.create(
      {
        payment_intent: paymentIntentId,
        ...(req.amount !== undefined ? { amount: Math.round(req.amount * 100) } : {}),
        ...(req.reason ? { metadata: { reason: req.reason.slice(0, 500) } } : {}),
      },
      // Idempotency: Stripe returns the original refund (no second charge-back)
      // if the same key is replayed within 24h.
      req.idempotencyKey ? { idempotencyKey: req.idempotencyKey } : undefined,
    )

    return {
      refundId: refund.id,
      amount: (refund.amount ?? 0) / 100,
    }
  }
}
