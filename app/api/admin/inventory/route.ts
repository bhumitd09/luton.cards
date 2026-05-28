import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdminSession } from '@/lib/admin-auth'
import { isSuperadmin, productListScope } from '@/lib/vendor-auth'

export const dynamic = 'force-dynamic'

/**
 * Inventory list + bulk stock PATCH.
 *
 * - GET: returns products scoped to the admin (vendors see only their own,
 *   superadmin sees all). Previously vendors could read every other
 *   vendor's price + stock here.
 * - PATCH: applies stock updates ONLY to product ids the admin owns.
 *   Other ids in the request are silently skipped. Closes the part of
 *   Critical finding C6 where a vendor could zero out another vendor's
 *   stock by passing their id.
 */

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminSession(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const products = await db.product.findMany({
      where: productListScope(admin),
      select: {
        id: true,
        name: true,
        category: true,
        stock: true,
        price: true,
        active: true,
        images: true,
      },
      orderBy: { stock: 'asc' },
    })

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Inventory GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await verifyAdminSession(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const updates = Array.isArray(body?.updates)
      ? (body.updates as Array<{ id?: string; stock?: number }>)
      : []
    if (updates.length === 0) {
      return NextResponse.json({ error: 'updates array is required' }, { status: 400 })
    }

    // Filter incoming updates to product ids the admin is allowed to touch.
    const ids = updates
      .map(u => (typeof u.id === 'string' ? u.id : null))
      .filter((id): id is string => id !== null)
    const ownedRows = await db.product.findMany({
      where: {
        id: { in: ids },
        ...productListScope(admin),
      },
      select: { id: true },
    })
    const owned = new Set(ownedRows.map(p => p.id))

    const allowedUpdates = updates.filter(
      u => typeof u.id === 'string'
        && owned.has(u.id)
        && Number.isInteger(u.stock)
        && (u.stock as number) >= 0,
    )

    await Promise.all(
      allowedUpdates.map(({ id, stock }) =>
        db.product.update({
          where: { id: id as string },
          data: { stock: stock as number },
        }),
      ),
    )

    return NextResponse.json({
      updated: allowedUpdates.length,
      skipped: updates.length - allowedUpdates.length,
      ...(isSuperadmin(admin) ? {} : { scoped: true }),
    })
  } catch (error) {
    console.error('Inventory PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
