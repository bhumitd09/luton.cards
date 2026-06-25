import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdminSession } from '@/lib/admin-auth'
import { isSuperadmin } from '@/lib/vendor-auth'

export const dynamic = 'force-dynamic'

/**
 * Aggregated customer view. Superadmin only — this returns every customer's
 * name, email, phone and order history. Vendors don't get a list of other
 * vendors' customers; they should use the orders list filtered to their own
 * items instead. Closes part of Critical finding C6.
 */
export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminSession(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!isSuperadmin(admin)) {
      return NextResponse.json({ error: 'Superadmin only' }, { status: 403 })
    }

    const orders = await db.order.findMany({
      include: { items: true },
      orderBy: { createdAt: 'asc' },
    })

    // Group orders by email
    const customerMap = new Map<string, {
      email: string
      name: string
      totalOrders: number
      totalSpent: number
      firstOrderAt: string
      lastOrderAt: string
      orders: typeof orders
    }>()

    for (const order of orders) {
      const existing = customerMap.get(order.email)
      if (existing) {
        existing.totalOrders += 1
        existing.totalSpent += order.total
        existing.lastOrderAt = order.createdAt.toISOString()
        existing.name = order.name // use most recent order's name
        existing.orders.push(order)
      } else {
        customerMap.set(order.email, {
          email: order.email,
          name: order.name,
          totalOrders: 1,
          totalSpent: order.total,
          firstOrderAt: order.createdAt.toISOString(),
          lastOrderAt: order.createdAt.toISOString(),
          orders: [order],
        })
      }
    }

    // Enrich each customer with their CustomerProfile (notes / tags / blocked)
    // so the admin list can show a Blocked badge + tags without an extra call.
    const emails = Array.from(customerMap.keys())
    const profiles = await db.customerProfile.findMany({
      where: { email: { in: emails } },
      select: { email: true, name: true, blocked: true, tags: true, adminNotes: true },
    })
    const profileByEmail = new Map(profiles.map(p => [p.email, p]))

    const customers = Array.from(customerMap.values())
      .map(c => {
        const p = profileByEmail.get(c.email)
        return {
          ...c,
          // An admin-set profile name overrides the name pulled from orders.
          name: (p?.name && p.name.trim()) ? p.name : c.name,
          blocked: p?.blocked ?? false,
          tags: p?.tags ?? [],
          hasNotes: !!(p?.adminNotes && p.adminNotes.length > 0),
        }
      })
      .sort((a, b) => b.totalSpent - a.totalSpent)

    return NextResponse.json({ customers })
  } catch (error) {
    console.error('Customers GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
