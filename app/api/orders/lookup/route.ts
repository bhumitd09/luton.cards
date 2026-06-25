import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { enforceRateLimit } from '@/lib/rate-limit'

/**
 * GET /api/orders/lookup?session_id=...  (or ?order_id=...)
 *
 * Minimal, unauthenticated lookup used by the checkout success page to show a
 * friendly order number (e.g. "ABCD1234") instead of the raw Stripe session
 * id. Keyed by the unguessable Stripe session id (or the order id), so it only
 * discloses a short reference + whether the order is already linked to an
 * account — never customer PII.
 */
export async function GET(req: NextRequest) {
  const block = enforceRateLimit(req, { bucket: 'orders-lookup', max: 30, windowMs: 60_000 })
  if (block) return block

  const sessionId = req.nextUrl.searchParams.get('session_id')?.trim()
  const orderId = req.nextUrl.searchParams.get('order_id')?.trim()
  if (!sessionId && !orderId) {
    return NextResponse.json({ error: 'Missing reference' }, { status: 400 })
  }

  const order = await db.order.findFirst({
    where: sessionId ? { stripeSessionId: sessionId } : { id: orderId as string },
    select: { id: true, userId: true },
  })
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    ref: order.id.slice(-8).toUpperCase(),
    linked: Boolean(order.userId),
  })
}
