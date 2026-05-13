import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const admin = getAdminFromRequest(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    const customers = Array.from(customerMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)

    return NextResponse.json({ customers })
  } catch (error) {
    console.error('Customers GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
