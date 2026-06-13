import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdminSession } from '@/lib/admin-auth'
import { isSuperadmin } from '@/lib/vendor-auth'
import { sendStatusTransitionEmail } from '@/lib/email'

const VALID_STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled']

/**
 * POST /api/admin/orders/bulk  — apply a status change to many orders at once.
 *
 * Body: { ids: string[], status: 'paid'|'shipped'|'delivered'|'cancelled' }
 *
 * Superadmin only (same gate as the single-order mutations). For each order
 * whose status actually changes, the matching customer email is auto-sent via
 * the shared transition engine — so a bulk "Mark shipped" emails every buyer.
 * Bulk shipped does NOT set tracking (do that per-order in the drawer); the
 * shipped email still goes out, just without a tracking number.
 */
export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdminSession(req)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isSuperadmin(admin)) {
      return NextResponse.json({ error: 'Superadmin only' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const ids = Array.isArray(body?.ids) ? body.ids.filter((x: unknown): x is string => typeof x === 'string') : []
    const status = typeof body?.status === 'string' ? body.status : ''

    if (ids.length === 0) {
      return NextResponse.json({ error: 'No orders selected' }, { status: 400 })
    }
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Load current state so we know which ones are actually transitioning
    // (and so we can fire emails only for real changes).
    const existing = await db.order.findMany({
      where: { id: { in: ids } },
      select: { id: true, status: true },
    })
    const prevById = new Map(existing.map(o => [o.id, o.status]))
    const toChange = existing.filter(o => o.status !== status).map(o => o.id)

    if (toChange.length === 0) {
      return NextResponse.json({ updated: 0, emailed: 0 })
    }

    await db.order.updateMany({
      where: { id: { in: toChange } },
      data: { status },
    })

    // Fire transition emails for each changed order (fire-and-forget).
    const updated = await db.order.findMany({
      where: { id: { in: toChange } },
      include: { items: true },
    })
    let emailed = 0
    for (const order of updated) {
      const prev = prevById.get(order.id) ?? ''
      // Only shipped/delivered/cancelled have customer emails
      if (['shipped', 'delivered', 'cancelled'].includes(order.status)) emailed++
      sendStatusTransitionEmail(prev, order).catch(err =>
        console.error('Bulk transition email failed:', order.id, err),
      )
    }

    return NextResponse.json({ updated: toChange.length, emailed })
  } catch (error) {
    console.error('Bulk orders error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
