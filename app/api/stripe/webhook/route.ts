import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { redeemDiscountByCode } from '@/lib/orders'
import { sendAdminSaleNotification } from '@/lib/email'
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
  // Variant-aware: if the line carries a variantId, the inventory we sold
  // from is the variant row, not the parent Product.stock. We keep the
  // parent product.stock untouched for variant-backed orders so it can act
  // as an "aggregate" if the admin chooses to surface it later.
  for (const item of order.items) {
    try {
      if (item.variantId) {
        // Conditional decrement: only when enough stock remains, so two
        // buyers racing on the last unit can't drive stock negative
        // (oversell). count===0 means we sold past available — log it loudly
        // so the order can be reconciled/refunded rather than silently shipped.
        const res = await db.productVariant.updateMany({
          where: { id: item.variantId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        })
        if (res.count === 0) {
          console.error('Stripe webhook: OVERSOLD variant — stock could not be decremented', {
            orderId, variantId: item.variantId, qty: item.quantity,
          })
        }
      } else if (item.productId) {
        const res = await db.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        })
        if (res.count === 0) {
          console.error('Stripe webhook: OVERSOLD product — stock could not be decremented', {
            orderId, productId: item.productId, qty: item.quantity,
          })
        }
      }
    } catch (err) {
      console.error('Stripe webhook: stock decrement error', { orderId, err })
    }
  }

  // Claim the discount use now that the order is actually paid (so abandoned
  // checkouts never burn a limited-use code). Idempotent flip above guarantees
  // this runs at most once per order.
  if (order.discountCode) {
    await redeemDiscountByCode(order.discountCode).catch(err =>
      console.error('Stripe webhook: discount redeem failed', { orderId, err }),
    )
  }

  // ─── Tell the shop owner something just SOLD: in-app bell + email ──────
  // Best-effort; never let a notification failure affect the 200 we owe Stripe.
  try {
    const itemSummary = order.items.map(i => `${i.quantity}× ${i.productName}`).join(', ')
    await notifyAdmins({
      type: 'sale',
      title: `Sale — £${order.total.toFixed(2)} paid`,
      body: `Order #${order.id.slice(-8).toUpperCase()} · ${itemSummary}`,
      href: '/admin/orders',
    })

    // Per-product thumbnails for the email.
    const ids = Array.from(new Set(order.items.map(i => i.productId).filter(Boolean)))
    const imageByProduct = new Map<string, string>()
    if (ids.length) {
      const prods = await db.product.findMany({ where: { id: { in: ids } }, select: { id: true, images: true } })
      for (const p of prods) {
        const first = Array.isArray(p.images) ? p.images.find((u): u is string => typeof u === 'string' && !!u) : undefined
        if (first) imageByProduct.set(p.id, first)
      }
    }
    await sendAdminSaleNotification({
      orderId: order.id,
      customerName: order.name,
      customerEmail: order.email,
      items: order.items.map(i => ({
        productName: i.productName,
        quantity: i.quantity,
        price: i.price,
        productImage: imageByProduct.get(i.productId),
      })),
      subtotal: order.total - (order.shippingCost ?? 0) + (order.discountAmount ?? 0),
      shippingCost: order.shippingCost ?? 0,
      discount: order.discountAmount ?? 0,
      total: order.total,
      shippingMethod: order.shippingMethod ?? undefined,
      shippingAddress: [order.shippingLine1, order.shippingCity, order.shippingPostcode].filter(Boolean).join(', '),
    })
  } catch (err) {
    console.error('Stripe webhook: sale notification failed', { orderId, err })
  }

  return NextResponse.json({ received: true })
}
