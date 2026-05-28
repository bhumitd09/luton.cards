import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-08-16' })

/**
 * Stripe webhook.
 *
 * Hardened against the "pay £1 for someone else's £900 order" attack:
 *
 *   1. Signature is verified (was correct before — kept).
 *   2. The session.id is matched against Order.stripeSessionId. If an
 *      attacker creates a Stripe session whose metadata.orderId points
 *      at a different order, the IDs won't line up and we reject.
 *   3. session.amount_total is compared to order.total * 100 (in pence).
 *      Any mismatch beyond a 1p rounding tolerance is logged and rejected.
 *   4. Only orders currently in 'pending' status are flipped to 'paid' —
 *      prevents replay of an old session event from re-triggering stock
 *      decrement after a refund or manual status change.
 */
export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') || ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Webhook signature failed' }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    // We only act on completion; ack everything else so Stripe stops retrying.
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as Stripe.Checkout.Session
  const orderId = session.metadata?.orderId
  if (!orderId) {
    console.warn('Stripe webhook: checkout.session.completed without metadata.orderId', { sessionId: session.id })
    return NextResponse.json({ received: true })
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })
  if (!order) {
    console.warn('Stripe webhook: order not found', { orderId, sessionId: session.id })
    return NextResponse.json({ received: true })
  }

  // (2) session.id must match the one we recorded at checkout-create time.
  if (order.stripeSessionId && order.stripeSessionId !== session.id) {
    console.error('Stripe webhook: session id mismatch — possible takeover attempt', {
      orderId, expected: order.stripeSessionId, got: session.id,
    })
    return NextResponse.json({ received: true })
  }

  // (3) amount_total must match the stored order total within 1 pence rounding.
  const expectedPence = Math.round(order.total * 100)
  const gotPence = session.amount_total ?? 0
  if (Math.abs(expectedPence - gotPence) > 1) {
    console.error('Stripe webhook: amount mismatch — refusing to flip to paid', {
      orderId, expectedPence, gotPence,
    })
    return NextResponse.json({ received: true })
  }

  // (4) Idempotent flip: only act on pending orders. Use updateMany with the
  //     status guard so a replayed event can't double-decrement stock.
  const updated = await db.order.updateMany({
    where: { id: orderId, status: 'pending' },
    data: { status: 'paid' },
  })
  if (updated.count === 0) {
    // Already processed (or cancelled). No-op.
    return NextResponse.json({ received: true, alreadyProcessed: true })
  }

  // Decrement stock now that we know we just won the status flip race.
  for (const item of order.items) {
    if (item.productId) {
      await db.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      }).catch(() => {}) // ignore if product was deleted
    }
  }

  return NextResponse.json({ received: true })
}
