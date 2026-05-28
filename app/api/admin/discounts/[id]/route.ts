import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdminSession } from '@/lib/admin-auth'
import { isSuperadmin } from '@/lib/vendor-auth'

/**
 * Single discount code edit / delete. Superadmin only. See sibling route
 * file for the full rationale.
 */

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdminSession(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!isSuperadmin(admin)) {
      return NextResponse.json({ error: 'Superadmin only' }, { status: 403 })
    }

    const { id } = params
    const body = await req.json()

    const existing = await db.discount.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Discount not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}

    if (body.code !== undefined) updateData.code = String(body.code).trim().toUpperCase()
    if (body.type !== undefined) {
      if (body.type !== 'percentage' && body.type !== 'fixed') {
        return NextResponse.json({ error: 'Type must be percentage or fixed' }, { status: 400 })
      }
      updateData.type = body.type
    }
    if (body.value !== undefined) updateData.value = Number(body.value)
    if (body.minOrder !== undefined) updateData.minOrder = body.minOrder != null ? Number(body.minOrder) : null
    if (body.maxUses !== undefined) updateData.maxUses = body.maxUses != null ? Number(body.maxUses) : null
    if (body.active !== undefined) updateData.active = Boolean(body.active)
    if (body.expiresAt !== undefined) updateData.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null

    const discount = await db.discount.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ discount })
  } catch (error: unknown) {
    const err = error as { code?: string }
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'A discount with that code already exists' }, { status: 409 })
    }
    console.error('Discount PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdminSession(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!isSuperadmin(admin)) {
      return NextResponse.json({ error: 'Superadmin only' }, { status: 403 })
    }

    const { id } = params

    const existing = await db.discount.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Discount not found' }, { status: 404 })
    }

    await db.discount.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Discount DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
