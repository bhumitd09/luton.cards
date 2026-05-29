import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdminSession } from '@/lib/admin-auth'
import { isSuperadmin } from '@/lib/vendor-auth'

const PAID_STATUSES = ['paid', 'shipped', 'delivered']

/**
 * Dashboard analytics — scoped by role.
 *
 *  - superadmin: whole-store numbers (revenue = sum of order totals,
 *    every product, every order, every customer).
 *  - vendor: only their own. Products filtered to their vendorId; orders
 *    filtered to those containing at least one of their items; revenue is
 *    the sum of THEIR OrderItem.vendorPayout (their share, not the whole
 *    order total); recent orders show only their own line items.
 *
 * The dashboard page + the sidebar badges both read this, so the same
 * payload shape is returned for both roles.
 */
export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminSession(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isSuper = isSuperadmin(admin)
    // Product + order scopes. Empty object = unscoped (superadmin).
    const productScope = isSuper ? {} : { vendorId: admin.userId }
    const orderScope = isSuper ? {} : { items: { some: { vendorId: admin.userId } } }

    const [
      totalProducts,
      activeProducts,
      featuredProducts,
      totalOrders,
      pendingOrders,
      lowStockProducts,
      outOfStockProducts,
      singleCount,
      gradedCount,
      boosterCount,
      sealedCount,
      recentOrdersRaw,
      catalogueValueResult,
      distinctCustomers,
    ] = await Promise.all([
      db.product.count({ where: { ...productScope } }),
      db.product.count({ where: { ...productScope, active: true } }),
      db.product.count({ where: { ...productScope, featured: true } }),
      db.order.count({ where: { ...orderScope } }),
      db.order.count({ where: { ...orderScope, status: 'pending' } }),
      db.product.count({ where: { ...productScope, stock: { lte: 2, gt: 0 } } }),
      db.product.count({ where: { ...productScope, stock: 0 } }),
      db.product.count({ where: { ...productScope, category: 'single' } }),
      db.product.count({ where: { ...productScope, category: 'graded' } }),
      db.product.count({ where: { ...productScope, category: 'booster' } }),
      db.product.count({ where: { ...productScope, category: 'sealed' } }),
      db.order.findMany({
        where: { ...orderScope },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      }),
      db.product.findMany({
        where: { ...productScope, active: true },
        select: { price: true, stock: true },
      }),
      db.order.groupBy({
        by: ['email'],
        where: { ...orderScope },
        _count: { email: true },
      }),
    ])

    // Revenue: whole order totals for superadmin; the vendor's own payout
    // share for vendors.
    let totalRevenue: number
    if (isSuper) {
      const r = await db.order.aggregate({
        _sum: { total: true },
        where: { status: { in: PAID_STATUSES } },
      })
      totalRevenue = r._sum.total ?? 0
    } else {
      const r = await db.orderItem.aggregate({
        _sum: { vendorPayout: true },
        where: { vendorId: admin.userId, order: { status: { in: PAID_STATUSES } } },
      })
      totalRevenue = r._sum.vendorPayout ?? 0
    }

    const catalogueValue = catalogueValueResult.reduce(
      (sum, product) => sum + product.price * product.stock,
      0,
    )

    // Vendors only see their own line items on the recent-orders list.
    const recentOrders = isSuper
      ? recentOrdersRaw
      : recentOrdersRaw.map(o => ({
          ...o,
          items: o.items.filter(it => it.vendorId === admin.userId),
        }))

    return NextResponse.json({
      totalProducts,
      activeProducts,
      featuredProducts,
      totalOrders,
      pendingOrders,
      totalRevenue,
      totalCustomers: distinctCustomers.length,
      lowStockProducts,
      outOfStockProducts,
      productsByCategory: {
        single: singleCount,
        graded: gradedCount,
        booster: boosterCount,
        sealed: sealedCount,
      },
      recentOrders,
      catalogueValue,
    })
  } catch (error) {
    console.error('Analytics GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
