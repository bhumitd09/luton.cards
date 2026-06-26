import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { enforceRateLimit } from '@/lib/rate-limit'
import { paymentProvider } from '@/lib/payments'
import { markOrderPaidOnce } from '@/lib/payments/fulfill'

/**
 * POST /api/checkout/confirm — { session_id }
 *
 * Reconciliation backstop, called by the checkout success page. The Stripe
 * webhook is the primary path that flips an order to paid; this is the safety
 * net for when the webhook is delayed, mis-delivered, or the endpoint was
 * briefly down — so a customer who paid is NEVER left with a stuck-pending
 * order.
 *
 * The gateway is the source of truth: we re-fetch the session server-side and
 * only flip the order if the gateway confirms it's paid AND the amount matches
 * what we stored. Same idempotent fulfilment as the webhook, so the two paths
 * can't double-process.
 */
export async function POST(req: NextRequest) {
  const block = enforceRateLimit(req, { bucket: 'checkout-confirm', max: 30, windowMs: 60_000 })
  if (block) return block

  const body = await req.json().catch(() => ({}))
  const sessionId = typeof body.session_id === 'string' ? body.session_id.trim() : ''
  if (!sessionId) return NextResponse.json({ error: 'session_id required' }, { status: 400 })

  // Provenance: we only reconcile an order we ourselves bound to this session.
  const order = await db.order.findFirst({
    where: { stripeSessionId: sessionId },
    select: { id: true, status: true, total: true },
  })
  if (!order) return NextResponse.json({ ok: true, status: 'unknown' })
  if (order.status === 'paid') return NextResponse.json({ ok: true, status: 'paid' })
  if (order.status !== 'pending') return NextResponse.json({ ok: true, status: order.status })

  const provider = paymentProvider()
  if (!provider.verifySession) return NextResponse.json({ ok: true, status: order.status })

  let verified: { paid: boolean; amountPence: number; ref: string }
  try {
    verified = await provider.verifySession(sessionId)
  } catch (err) {
    console.error('checkout/confirm: verifySession failed', { sessionId, err })
    return NextResponse.json({ ok: true, status: order.status })
  }

  // Not paid yet (or amount doesn't match what we charged) — leave it pending;
  // the webhook will handle it, or it genuinely wasn't paid.
  if (!verified.paid) return NextResponse.json({ ok: true, status: 'pending' })
  if (verified.ref !== sessionId) return NextResponse.json({ ok: true, status: 'pending' })
  if (Math.abs(Math.round(order.total * 100) - verified.amountPence) > 1) {
    console.error('checkout/confirm: amount mismatch — refusing to flip', { orderId: order.id, expected: Math.round(order.total * 100), got: verified.amountPence })
    return NextResponse.json({ ok: true, status: 'pending' })
  }

  const result = await markOrderPaidOnce(order.id)
  return NextResponse.json({ ok: true, status: result.status })
}
