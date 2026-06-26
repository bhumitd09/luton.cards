import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { markOrderPaidOnce } from '@/lib/payments/fulfill'
import { notifyAdmins } from '@/lib/notifications'

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
  //     Fail CLOSED: an order with no recorded stripeSessionId never went
  //     through our checkout-create, so we must not flip it to paid on the
  //     strength of amount-matching alone.
  if (!order.stripeSessionId || order.stripeSessionId !== session.id) {
    console.error('Stripe webhook: session id missing/mismatch — refusing to flip to paid', {
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

  // (3.5) Only treat a genuinely-paid session as paid. Card checkout is always
  //       'paid' here; async payment methods can fire 'completed' while still
  //       awaiting funds. 'no_payment_required' = a fully-discounted £0 order.
  if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
    console.warn('Stripe webhook: session completed but not paid yet', { orderId, payment_status: session.payment_status })
    return NextResponse.json({ received: true })
  }

  // (4) Flip to paid + fulfil (stock, discount, emails) exactly once. Shared
  //     with the success-page reconciliation backstop; the atomic pending→paid
  //     guard inside means only one path ever processes a given order.
  const result = await markOrderPaidOnce(orderId)
  if (!result.flipped && result.status !== 'paid' && result.status !== 'missing') {
    // Real payment landed on an order that's no longer payable (e.g. cancelled).
    console.error('Stripe webhook: payment received for non-pending order', { orderId, status: result.status })
    await notifyAdmins({
      type: 'refund',
      title: `⚠️ Paid but order is ${result.status}`,
      body: `Order #${order.id.slice(-8).toUpperCase()} (${order.name}) was paid on Stripe but is marked ${result.status}. Money was taken — refund or reinstate it.`,
      href: '/admin/orders',
    }).catch(() => {})
  }

  return NextResponse.json({ received: true })
}
