import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/admin-auth'

export async function PUT(req: NextRequest, { params }: { params: { rateId: string } }) {
  try {
    const admin = getAdminFromRequest(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, price, minDays, maxDays, freeAbove, active } = body

    const rate = await db.shippingRate.update({
      where: { id: params.rateId },
      data: {
        ...(name !== undefined && { name }),
        ...(price !== undefined && { price }),
        ...(minDays !== undefined && { minDays }),
        ...(maxDays !== undefined && { maxDays }),
        ...(freeAbove !== undefined && { freeAbove }),
        ...(active !== undefined && { active }),
      },
    })

    return NextResponse.json({ rate })
  } catch (error) {
    console.error('Shipping rate PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { rateId: string } }) {
  try {
    const admin = getAdminFromRequest(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await db.shippingRate.delete({ where: { id: params.rateId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Shipping rate DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
