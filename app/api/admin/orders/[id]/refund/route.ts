import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdminSession } from '@/lib/admin-auth'
import { isSuperadmin } from '@/lib/vendor-auth'
import { paymentProvider } from '@/lib/payments'

/**
 * POST /api/admin/orders/[id]/refund — superadmin only.
 *
 * Refunds all or part of a captured payment, then records the refunded
 * amount on the order. A full refund (cumulative refunds >= total) also
 * flips the order to 'cancelled'.
 *
 * Body: { amount?: number, reason?: string }
 *  - amount omitted → refund the full remaining balance.
 *  - amount must be > 0 and <= (total - already refunded).
 *
 * Orders with a gateway reference (Order.paymentRef) are refunded through
 * the active payment provider. Manual/offline orders with no reference just
 * record the refund (the money was handled outside the gateway).
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await verifyAdminSession(req)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isSuperadmin(admin)) {
      return NextResponse.json({ error: 'Superadmin only' }, { status: 403 })
    }

    const order = await db.order.findUnique({ where: { id: params.id } })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    if (!['paid', 'shipped', 'delivered'].includes(order.status)) {
      return NextResponse.json(
        { error: 'Only paid, shipped or delivered orders can be refunded.' },
        { status: 400 },
      )
    }

    const body = await req.json().catch(() => ({}))
    const alreadyRefunded = order.refundedAmount ?? 0
    const remaining = Math.max(0, Math.round((order.total - alreadyRefunded) * 100) / 100)

    if (remaining <= 0) {
      return NextResponse.json({ error: 'This order has already been fully refunded.' }, { status: 400 })
    }

    // Default to a full remaining refund when no amount is given.
    let amount = remaining
    if (body.amount !== undefined) {
      const n = Number(body.amount)
      if (!Number.isFinite(n) || n <= 0) {
        return NextResponse.json({ error: 'Refund amount must be greater than zero.' }, { status: 400 })
      }
      // Round to pence and guard against floating-point overshoot.
      amount = Math.round(n * 100) / 100
      if (amount > remaining + 0.001) {
        return NextResponse.json(
          { error: `Refund exceeds the £${remaining.toFixed(2)} remaining on this order.` },
          { status: 400 },
        )
      }
      amount = Math.min(amount, remaining)
    }

    const reason = typeof body.reason === 'string' ? body.reason.trim() : undefined

    // Run the gateway refund when there's a captured payment to refund against.
    let refundId: string | null = null
    if (order.paymentRef) {
      try {
        const result = await paymentProvider().refund({ ref: order.paymentRef, amount, reason })
        refundId = result.refundId
        // Trust the gateway's actual refunded amount.
        amount = Math.round(result.amount * 100) / 100
      } catch (err) {
        console.error('Gateway refund failed:', err)
        return NextResponse.json(
          { error: err instanceof Error ? err.message : 'The payment gateway rejected the refund.' },
          { status: 502 },
        )
      }
    }

    const newRefunded = Math.round((alreadyRefunded + amount) * 100) / 100
    const fullyRefunded = newRefunded >= order.total - 0.001

    const updated = await db.order.update({
      where: { id: order.id },
      data: {
        refundedAmount: newRefunded,
        refundedAt: new Date(),
        ...(fullyRefunded ? { status: 'cancelled' } : {}),
        notes: [order.notes, `Refunded £${amount.toFixed(2)}${reason ? ` — ${reason}` : ''}${refundId ? ` (${refundId})` : ' (offline)'}`]
          .filter(Boolean)
          .join('\n'),
      },
      include: { items: true },
    })

    return NextResponse.json({ order: updated, refunded: amount, fullyRefunded, refundId })
  } catch (error) {
    console.error('Refund error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
