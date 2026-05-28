import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-08-16' })

/**
 * POST /api/stripe/checkout
 *
 * Creates a Stripe Checkout session for an existing Order. The caller passes
 * { orderId } (created via /api/orders) plus optional shipping line label.
 * EVERYTHING about pricing is recomputed server-side from the Order + its
 * OrderItems + the live Product table:
 *
 *   - line item prices come from the OrderItem rows (already server-validated
 *     at order creation against the live Product.price)
 *   - shipping cost comes from Order.shippingCost (also server-validated)
 *   - the resulting Stripe session amount is what the webhook will verify
 *     before flipping the Order to 'paid'
 *
 * The legacy contract (caller-supplied `items[]` with `price`) is GONE.
 * That hole let attackers edit devtools and pay £0.01 for a £900 card.
 *
 * The Stripe session id is persisted back onto the Order so the webhook
 * can confirm `session.id === order.stripeSessionId` and refuse to flip
 * the status if an attacker tries to point one session's metadata at
 * another customer's order.
 */
export async function POST(req: NextRequest) {
  let body: { orderId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const orderId = typeof body.orderId === 'string' ? body.orderId : ''
  if (!orderId) {
    return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }
  if (order.status !== 'pending') {
    return NextResponse.json(
      { error: `Order is in status '${order.status}' and cannot start a new checkout.` },
      { status: 409 },
    )
  }
  if (order.items.length === 0) {
    return NextResponse.json({ error: 'Order has no items.' }, { status: 400 })
  }

  // Build line items from server-stored OrderItem prices. Each was validated
  // against Product.price at order-creation time (see /api/orders) — we do
  // NOT trust any client-supplied number here.
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = order.items.map(item => ({
    price_data: {
      currency: 'gbp',
      product_data: {
        name: item.productName,
        metadata: { productId: item.productId || '' },
      },
      unit_amount: Math.round(item.price * 100), // pence
    },
    quantity: item.quantity,
  }))

  // Server-stored shipping cost. Same trust model.
  const shippingPence = Math.round((order.shippingCost ?? 0) * 100)
  if (shippingPence > 0) {
    lineItems.push({
      price_data: {
        currency: 'gbp',
        product_data: {
          name: `Shipping${order.shippingMethod ? ` - ${order.shippingMethod}` : ''}`,
        },
        unit_amount: shippingPence,
      },
      quantity: 1,
    })
  }

  // Discount: apply as a Stripe discount via amount-off or percent-off.
  const discountOpts: Stripe.Checkout.SessionCreateParams['discounts'] = []
  if (order.discountAmount && order.discountAmount > 0 && order.discountCode) {
    // Use a one-off coupon scoped to this session.
    const coupon = await stripe.coupons.create({
      amount_off: Math.round(order.discountAmount * 100),
      currency: 'gbp',
      name: order.discountCode,
      duration: 'once',
    })
    discountOpts.push({ coupon: coupon.id })
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    customer_email: order.email,
    // metadata carries the Order id so the webhook can find it. It's just
    // an identifier — pricing comes from the session itself, not metadata.
    metadata: { orderId: order.id, customerName: order.name },
    ...(discountOpts.length > 0 ? { discounts: discountOpts } : {}),
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout`,
  })

  // Persist the session id so the webhook can confirm provenance.
  await db.order.update({
    where: { id: order.id },
    data: { stripeSessionId: session.id },
  })

  return NextResponse.json({ url: session.url, sessionId: session.id })
}
