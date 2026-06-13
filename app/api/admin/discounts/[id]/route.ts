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
    // The resulting type matters for value validation below — use the new type
    // if supplied, otherwise the existing one.
    const effectiveType = body.type !== undefined ? body.type : existing.type
    if (body.type !== undefined) {
      if (body.type !== 'percentage' && body.type !== 'fixed') {
        return NextResponse.json({ error: 'Type must be percentage or fixed' }, { status: 400 })
      }
      updateData.type = body.type
    }
    if (body.value !== undefined) {
      const value = Number(body.value)
      if (!Number.isFinite(value) || value <= 0) {
        return NextResponse.json({ error: 'Value must be a positive number' }, { status: 400 })
      }
      if (effectiveType === 'percentage' && value > 100) {
        return NextResponse.json({ error: 'Percentage discount cannot exceed 100' }, { status: 400 })
      }
      updateData.value = value
    }
    if (body.minOrder !== undefined) {
      if (body.minOrder == null) {
        updateData.minOrder = null
      } else {
        const minOrder = Number(body.minOrder)
        if (!Number.isFinite(minOrder) || minOrder < 0) {
          return NextResponse.json({ error: 'Minimum order must be zero or more' }, { status: 400 })
        }
        updateData.minOrder = minOrder
      }
    }
    if (body.maxUses !== undefined) {
      if (body.maxUses == null) {
        updateData.maxUses = null
      } else {
        const maxUses = Number(body.maxUses)
        if (!Number.isInteger(maxUses) || maxUses < 1) {
          return NextResponse.json({ error: 'Max uses must be a positive whole number' }, { status: 400 })
        }
        updateData.maxUses = maxUses
      }
    }
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
