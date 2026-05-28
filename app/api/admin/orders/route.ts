import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdminSession } from '@/lib/admin-auth'
import { isSuperadmin, orderListScope } from '@/lib/vendor-auth'

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

    const where: Record<string, unknown> = { ...orderListScope(admin) }
    if (status) where.status = status
    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { email: { contains: search.trim(), mode: 'insensitive' } },
      ]
    }

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

// POST removed — admin-created orders now route through /api/orders so they
// share the same server-side price + stock validation as customer orders.
