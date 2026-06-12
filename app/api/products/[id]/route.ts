import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Public single-product API. READ ONLY.
 *
 * Authenticated mutation has moved to /api/admin/products/[id], where the
 * admin session is verified and vendor ownership is enforced. The previous
 * unauthenticated PUT/DELETE handlers were the most severe finding from
 * the security audit and have been removed entirely.
 *
 * Includes active variants so the PDP can render the condition selector.
 */

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const product = await db.product.findUnique({
      where: { id: params.id },
      include: {
        variants: {
          where: { active: true },
          orderBy: [{ condition: 'asc' }, { foil: 'asc' }],
        },
      },
    })
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    return NextResponse.json({ ...product, image: product.images?.[0] || '' })
  } catch {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }
}
