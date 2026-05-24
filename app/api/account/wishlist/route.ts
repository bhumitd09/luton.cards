import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCustomerFromRequest } from '@/lib/customer-auth'

/**
 * GET   /api/account/wishlist            — list customer's wishlist items with product data
 * POST  /api/account/wishlist            — body { productId } — adds to wishlist
 * (DELETE handled in [productId]/route.ts)
 */

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = getCustomerFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const items = await db.wishlist.findMany({
    where: { userId: auth.userId },
    orderBy: { createdAt: 'desc' },
  })

  if (items.length === 0) {
    return NextResponse.json({ items: [] })
  }

  const productIds = items.map(i => i.productId)
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
  })
  const productMap = new Map(products.map(p => [p.id, p]))

  const populated = items
    .map(item => {
      const product = productMap.get(item.productId)
      if (!product) return null
      return {
        id: item.id,
        productId: item.productId,
        createdAt: item.createdAt,
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          stock: product.stock,
          category: product.category,
          game: product.game,
          grade: product.grade,
          grader: product.grader,
          image: product.images?.[0] || '',
          active: product.active,
        },
      }
    })
    .filter(Boolean)

  return NextResponse.json({ items: populated })
}

export async function POST(req: NextRequest) {
  const auth = getCustomerFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { productId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const productId = body.productId?.trim()
  if (!productId) return NextResponse.json({ error: 'productId is required' }, { status: 400 })

  // Validate product exists + is active
  const product = await db.product.findUnique({ where: { id: productId } })
  if (!product || !product.active) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  // Upsert so duplicate adds are idempotent
  const item = await db.wishlist.upsert({
    where: { userId_productId: { userId: auth.userId, productId } },
    update: {},
    create: { userId: auth.userId, productId },
  })

  return NextResponse.json({ ok: true, item }, { status: 201 })
}
