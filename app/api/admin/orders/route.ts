import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdminSession } from '@/lib/admin-auth'
import { isSuperadmin, orderListScope } from '@/lib/vendor-auth'
import { priceOrderLines, applyDiscountCode, redeemDiscountUse, buildOrderItemCreates, decrementStockForLines, PricingError } from '@/lib/orders'

/**
 * GET /api/admin/orders
 *
 * Lists orders for the back office.
 *  - Superadmin sees every order.
 *  - Vendors see only orders containing at least one of their own
 *    OrderItems (server-side scope, applied in the WHERE clause).
 *
 * For vendors we also drop OrderItem.price and customer phone/address
 * from items belonging to other vendors before returning — they
 * shouldn't see other vendors' line totals or another vendor's
 * customer's address even on a shared order. Vendor sees ONLY their
 * own items on a given order.
 *
 * POST is deprecated — admin-created orders should go through the
 * normal /api/orders flow.
 */
export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminSession(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20', 10))
    const skip = (page - 1) * limit

    // An order only really "exists" once it's paid. A customer who hits "Pay"
    // then backs out of Stripe leaves an abandoned pending web order — those
    // are noise, not real orders, so we hide them from the list AND every
    // count. (Manual/admin-created pending orders are real drafts and stay.)
    // Lazy housekeeping: purge abandoned web orders older than 2h — well past
    // the Stripe session's 60-min expiry, so this can never delete one that's
    // still payable.
    await db.order.deleteMany({
      where: {
        status: 'pending',
        isManual: false,
        createdAt: { lt: new Date(Date.now() - 2 * 60 * 60_000) },
      },
    }).catch(() => {})

    const where: Record<string, unknown> = { ...orderListScope(admin) }
    if (status) where.status = status
    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { email: { contains: search.trim(), mode: 'insensitive' } },
      ]
    }
    // Exclude unpaid web checkouts (pending + not manual) everywhere.
    where.NOT = { status: 'pending', isManual: false }

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.order.count({ where }),
    ])

    // Vendor view: only return the items the vendor owns. Superadmin sees all.
    const scoped = isSuperadmin(admin)
      ? orders
      : orders.map(o => ({
          ...o,
          items: o.items.filter(it => it.vendorId === admin.userId),
        }))

    return NextResponse.json({
      orders: scoped,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Orders GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/orders — superadmin manual order creation.
 *
 * For phone/in-person/offline sales the admin records directly. Pricing is
 * NEVER trusted from the request: items carry only { productId, quantity,
 * variantId? } and prices are recomputed via the same shared pricer the
 * public checkout uses. The order is flagged isManual and, because there is
 * no gateway webhook to do it, stock is decremented at creation when the
 * order is created in a stock-consuming status (anything but 'pending'/'cancelled').
 *
 * Body: { name, email, phone?, shipping fields, shippingCost?, status?,
 *         discountCode?, items: [{ productId, quantity, variantId? }] }
 */
export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdminSession(req)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isSuperadmin(admin)) {
      return NextResponse.json({ error: 'Superadmin only' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    const VALID = ['pending', 'paid', 'shipped', 'delivered', 'cancelled']
    const status = VALID.includes(body.status) ? body.status : 'paid'

    const { lines, subtotal } = await priceOrderLines(Array.isArray(body.items) ? body.items : [])

    const requestedShipping = typeof body.shippingCost === 'number' && isFinite(body.shippingCost) ? body.shippingCost : 0
    const safeShipping = Math.max(0, Math.min(100, requestedShipping))

    let appliedDiscount = await applyDiscountCode(body.discountCode, subtotal)
    if (appliedDiscount && !(await redeemDiscountUse(appliedDiscount))) {
      appliedDiscount = null
    }
    const discountSavings = appliedDiscount?.savings ?? 0
    const finalTotal = Math.max(0, subtotal + safeShipping - discountSavings)

    const order = await db.order.create({
      data: {
        name,
        email,
        phone: body.phone ?? null,
        shippingLine1: body.shippingLine1 ?? null,
        shippingLine2: body.shippingLine2 ?? null,
        shippingCity: body.shippingCity ?? null,
        shippingPostcode: body.shippingPostcode ?? null,
        shippingCountry: body.shippingCountry ?? 'GB',
        shippingMethod: body.shippingMethod ?? null,
        shippingCost: safeShipping,
        status,
        total: finalTotal,
        // Mark stock as already taken when we decrement below, so a later
        // status change can't double-decrement (the flag guards it).
        stockDecremented: status !== 'pending' && status !== 'cancelled',
        isManual: true,
        discountCode: appliedDiscount?.code ?? null,
        discountAmount: discountSavings,
        items: { create: buildOrderItemCreates(lines) },
      },
      include: { items: true },
    })

    // No gateway webhook for manual orders, so decrement stock here whenever
    // the order consumes inventory (i.e. not a draft 'pending' or 'cancelled').
    let oversold: { productName?: string }[] = []
    if (status !== 'pending' && status !== 'cancelled') {
      oversold = await decrementStockForLines(lines)
    }
    // (Discount use was already claimed atomically above.)

    return NextResponse.json({
      order, orderId: order.id, total: finalTotal, success: true,
      ...(oversold.length > 0 ? { warning: `Created, but ${oversold.length} item(s) had insufficient stock and were not decremented.` } : {}),
    }, { status: 201 })
  } catch (error) {
    if (error instanceof PricingError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Manual order create error:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
