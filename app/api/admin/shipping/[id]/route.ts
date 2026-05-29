import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifySuperadminSession } from '@/lib/admin-auth'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await verifySuperadminSession(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const zone = await db.shippingZone.findUnique({
      where: { id: params.id },
      include: { rates: { orderBy: { price: 'asc' } } },
    })

    if (!zone) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 })
    }

    return NextResponse.json({ zone })
  } catch (error) {
    console.error('Shipping zone GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await verifySuperadminSession(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, countries, active } = body

    const zone = await db.shippingZone.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(countries !== undefined && { countries }),
        ...(active !== undefined && { active }),
      },
      include: { rates: { orderBy: { price: 'asc' } } },
    })

    return NextResponse.json({ zone })
  } catch (error) {
    console.error('Shipping zone PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await verifySuperadminSession(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await db.shippingZone.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Shipping zone DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
