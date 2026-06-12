import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/products/stock?ids=<key>,<key>,...
 *
 * Each key is either:
 *   - a product id (single-SKU lookup), OR
 *   - `${productId}:${variantId}` for a specific condition variant.
 *
 * Returns a map keyed by the same strings you sent, with the live stock
 * (0 if the row is missing or inactive).
 *
 * Used by the cart context to validate quantities + warn on "Max stock"
 * after a page reload.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const raw = searchParams.get('ids') || ''
  const ids = raw.split(',').map(s => s.trim()).filter(Boolean)
  if (ids.length === 0) return NextResponse.json({})

  // Partition keys into bare product ids vs variant-scoped ids.
  const productIds = new Set<string>()
  const variantIds = new Set<string>()
  const variantToProduct = new Map<string, string>() // variantId → original key
  for (const key of ids) {
    const idx = key.indexOf(':')
    if (idx === -1) {
      productIds.add(key)
    } else {
      const variantId = key.slice(idx + 1)
      if (variantId) {
        variantIds.add(variantId)
        variantToProduct.set(variantId, key)
      }
    }
  }

  const map: Record<string, number> = {}
  try {
    if (productIds.size > 0) {
      const products = await db.product.findMany({
        where: { id: { in: Array.from(productIds) } },
        select: { id: true, stock: true, active: true },
      })
      for (const key of productIds) {
        const p = products.find(x => x.id === key)
        map[key] = p && p.active ? p.stock : 0
      }
    }
    if (variantIds.size > 0) {
      const variants = await db.productVariant.findMany({
        where: { id: { in: Array.from(variantIds) } },
        select: { id: true, stock: true, active: true },
      })
      for (const variantId of variantIds) {
        const v = variants.find(x => x.id === variantId)
        const originalKey = variantToProduct.get(variantId)
        if (originalKey) map[originalKey] = v && v.active ? v.stock : 0
      }
    }
    return NextResponse.json(map)
  } catch {
    return NextResponse.json({})
  }
}
