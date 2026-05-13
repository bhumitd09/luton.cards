import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Public stats endpoint — no auth required
// Returns real counts from the DB for display on the storefront
export async function GET() {
  try {
    const [totalStock, totalOrders, totalProducts] = await Promise.all([
      // Sum of all active product stock
      db.product.aggregate({
        _sum: { stock: true },
        where: { active: true },
      }),
      // Total orders ever placed
      db.order.count(),
      // Total active products
      db.product.count({ where: { active: true } }),
    ])

    return NextResponse.json({
      totalStock: totalStock._sum.stock ?? 0,
      totalProducts,
      totalOrders,
    })
  } catch {
    return NextResponse.json({ totalStock: 0, totalProducts: 0, totalOrders: 0 })
  }
}
