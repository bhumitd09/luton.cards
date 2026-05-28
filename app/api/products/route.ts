import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Public product listing API. READ ONLY.
 *
 * The previous version of this file ALSO exported a `POST` that anyone on
 * the internet could call to create products. That hole let an attacker
 * wipe stock, rewrite prices, or reassign vendorId. It was removed during
 * the security hardening pass — the admin equivalent at
 * /api/admin/products handles authenticated writes.
 *
 * Same story for /api/products/[id] — only GET remains; PUT/DELETE moved
 * to /api/admin/products/[id] where auth + vendor ownership are enforced.
 */

const VALID_GAMES = new Set(['pokemon', 'one-piece'])

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const game = searchParams.get('game')
  const featured = searchParams.get('featured')

  try {
    const products = await db.product.findMany({
      where: {
        active: true,
        ...(category && category !== 'all' ? { category } : {}),
        ...(game && VALID_GAMES.has(game) ? { game } : {}),
        ...(featured === 'true' ? { featured: true } : {}),
      },
      orderBy: { createdAt: 'desc' },
    })
    const normalised = products.map(p => ({ ...p, image: p.images?.[0] || '' }))
    return NextResponse.json(normalised)
  } catch {
    return NextResponse.json([])
  }
}
