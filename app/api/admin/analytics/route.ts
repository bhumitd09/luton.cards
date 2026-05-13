import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/admin-auth'

export async function GET(req: NextRequest) {
  try {
    const admin = getAdminFromRequest(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [
      totalProducts,
      activeProducts,
      featuredProducts,
      totalOrders,
      pendingOrders,
      revenueResult,
      lowStockProducts,
      outOfStockProducts,
      singleCount,
      gradedCount,
      boosterCount,
      sealedCount,
      recentOrders,
      catalogueValueResult,
      distinctCustomers,
    ] = await Promise.all([
      db.product.count(),
      db.product.count({ where: { active: true } }),
      db.product.count({ where: { featured: true } }),
      db.order.count(),
      db.order.count({ where: { status: 'pending' } }),
      db.order.aggregate({
        _sum: { total: true },
        where: { status: { in: ['paid', 'shipped', 'delivered'] } },
      }),
      db.product.count({ where: { stock: { lte: 2, gt: 0 } } }),
      db.product.count({ where: { stock: 0 } }),
      db.product.count({ where: { category: 'single' } }),
      db.product.count({ where: { category: 'graded' } }),
      db.product.count({ where: { category: 'booster' } }),
      db.product.count({ where: { category: 'sealed' } }),
      db.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      }),
      db.product.findMany({
        where: { active: true },
        select: { price: true, stock: true },
      }),
      db.order.groupBy({
        by: ['email'],
        _count: { email: true },
      }),
    ])

    const catalogueValue = catalogueValueResult.reduce(
      (sum, product) => sum + product.price * product.stock,
      0
    )

    return NextResponse.json({
      totalProducts,
      activeProducts,
      featuredProducts,
      totalOrders,
      pendingOrders,
      totalRevenue: revenueResult._sum.total ?? 0,
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
