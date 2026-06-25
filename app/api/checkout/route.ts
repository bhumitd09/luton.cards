import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { paymentProvider } from '@/lib/payments'
import { enforceRateLimit } from '@/lib/rate-limit'

/**
 * POST /api/checkout  — provider-agnostic checkout entry point.
 *
 * Body: { orderId }. The Order was already created + fully price-validated
 * by /api/orders. This route:
 *   1. loads the order, checks it's pending + non-empty (provider-agnostic),
 *   2. hands it to the active payment driver (Stripe today, Square when
 *      PAYMENT_PROVIDER=square),
 *   3. persists paymentProvider + paymentRef (and stripeSessionId for the
 *      Stripe webhook's provenance check),
 *   4. returns the hosted checkout URL.
 *
 * The old /api/stripe/checkout still works — it now delegates here.
 */
export async function POST(req: NextRequest) {
  // Cap per IP so payment-session creation can't be hammered (Stripe object churn).
  const block = enforceRateLimit(req, { bucket: 'checkout', max: 15, windowMs: 60_000 })
  if (block) return block

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

  const provider = paymentProvider()

  let result: { url: string; ref: string }
  try {
    result = await provider.createCheckout({
      id: order.id,
      email: order.email,
      name: order.name,
      total: order.total,
      shippingCost: order.shippingCost,
      shippingMethod: order.shippingMethod,
      discountCode: order.discountCode,
      discountAmount: order.discountAmount,
      items: order.items.map(i => ({
        productName: i.productName,
        price: i.price,
        quantity: i.quantity,
        productId: i.productId,
        variantCondition: i.variantCondition,
        variantFoil: i.variantFoil,
      })),
    })
  } catch (err) {
    // Log the detail server-side; return a generic message so internal/library
    // errors aren't leaked to unauthenticated callers.
    console.error('Checkout create error:', err)
    return NextResponse.json(
      { error: 'Could not start payment. Please try again.' },
      { status: 500 },
    )
  }

  // Persist provider + ref. For Stripe also mirror into stripeSessionId so the
  // existing Stripe webhook's provenance check keeps working unchanged.
  await db.order.update({
    where: { id: order.id },
    data: {
      paymentProvider: provider.name,
      paymentRef: result.ref,
      ...(provider.name === 'stripe' ? { stripeSessionId: result.ref } : {}),
    },
  })

  return NextResponse.json({ url: result.url, ref: result.ref })
}
