import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdminSession } from '@/lib/admin-auth'
import { isSuperadmin } from '@/lib/vendor-auth'
import { priceOrderLines, applyDiscountCode, buildOrderItemCreates, PricingError } from '@/lib/orders'

/**
 * PUT /api/admin/orders/[id]/items — superadmin only.
 *
 * Replaces an order's line items wholesale and recomputes the total. The
 * caller sends the desired full set: items: [{ productId, quantity, variantId? }].
 * Prices are re-fetched from the live catalogue (never trusted from the
 * body), shipping is preserved, and any discount code on the order is
 * re-applied against the new subtotal so percentage discounts stay correct.
 *
 * Only editable while pending or paid — once an order ships its contents are
 * frozen. Stock is intentionally NOT auto-adjusted here: line-item edits are
 * corrections, and the relationship to physical inventory is handled through
 * the inventory tools, not implied by an order edit.
 */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await verifyAdminSession(req)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isSuperadmin(admin)) {
      return NextResponse.json({ error: 'Superadmin only' }, { status: 403 })
    }

    const order = await db.order.findUnique({ where: { id: params.id } })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    if (!['pending', 'paid'].includes(order.status)) {
      return NextResponse.json(
        { error: 'Only pending or paid orders can have their items edited.' },
        { status: 400 },
      )
    }

    const body = await req.json().catch(() => ({}))
    const { lines, subtotal } = await priceOrderLines(Array.isArray(body.items) ? body.items : [])

    // Re-apply the order's existing discount against the new subtotal.
    const appliedDiscount = await applyDiscountCode(order.discountCode, subtotal)
    const discountSavings = appliedDiscount?.savings ?? 0
    const shipping = order.shippingCost ?? 0
    const finalTotal = Math.max(0, subtotal + shipping - discountSavings)

    // Replace items + retotal in one transaction.
    const updated = await db.$transaction(async (tx) => {
      await tx.orderItem.deleteMany({ where: { orderId: order.id } })
      return tx.order.update({
        where: { id: order.id },
        data: {
          total: finalTotal,
          discountAmount: discountSavings,
          discountCode: appliedDiscount?.code ?? null,
          items: { create: buildOrderItemCreates(lines) },
        },
        include: { items: true },
      })
    })

    return NextResponse.json({ order: updated, subtotal, total: finalTotal })
  } catch (error) {
    if (error instanceof PricingError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Order items edit error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
