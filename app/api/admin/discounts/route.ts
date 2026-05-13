import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/admin-auth'

export async function GET(req: NextRequest) {
  try {
    const admin = getAdminFromRequest(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const discounts = await db.discount.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ discounts })
  } catch (error) {
    console.error('Discounts GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = getAdminFromRequest(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { code, type, value, minOrder, maxUses, expiresAt } = body

    if (!code || typeof code !== 'string' || !code.trim()) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }

    if (type !== 'percentage' && type !== 'fixed') {
      return NextResponse.json({ error: 'Type must be percentage or fixed' }, { status: 400 })
    }

    if (typeof value !== 'number' || value <= 0) {
      return NextResponse.json({ error: 'Value must be a positive number' }, { status: 400 })
    }

    if (type === 'percentage' && value > 100) {
      return NextResponse.json({ error: 'Percentage value cannot exceed 100' }, { status: 400 })
    }

    const discount = await db.discount.create({
      data: {
        code: code.trim().toUpperCase(),
        type,
        value,
        minOrder: minOrder != null ? Number(minOrder) : null,
        maxUses: maxUses != null ? Number(maxUses) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    })

    return NextResponse.json({ discount }, { status: 201 })
  } catch (error: unknown) {
    const err = error as { code?: string }
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'A discount with that code already exists' }, { status: 409 })
    }
    console.error('Discounts POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
