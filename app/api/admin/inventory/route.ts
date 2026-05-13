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

    const products = await db.product.findMany({
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
    const admin = getAdminFromRequest(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { updates } = body as { updates: Array<{ id: string; stock: number }> }

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: 'updates array is required' }, { status: 400 })
    }

    await Promise.all(
      updates.map(({ id, stock }) =>
        db.product.update({
          where: { id },
          data: { stock },
        })
      )
    )

    return NextResponse.json({ updated: updates.length })
  } catch (error) {
    console.error('Inventory PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
