import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/products/stock?ids=id1,id2,id3
// Returns live stock levels for the given product IDs
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const raw = searchParams.get('ids') || ''
  const ids = raw.split(',').map(s => s.trim()).filter(Boolean)

  if (ids.length === 0) return NextResponse.json({})

  try {
    const products = await db.product.findMany({
      where: { id: { in: ids } },
      select: { id: true, stock: true, active: true },
    })
    // Return a map: { [id]: stock } — 0 if product inactive or not found
    const map: Record<string, number> = {}
    for (const id of ids) {
      const p = products.find(x => x.id === id)
      map[id] = p && p.active ? p.stock : 0
    }
    return NextResponse.json(map)
  } catch {
    return NextResponse.json({})
  }
}
