import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifySuperadminSession } from '@/lib/admin-auth'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await verifySuperadminSession(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rates = await db.shippingRate.findMany({
      where: { zoneId: params.id },
      orderBy: { price: 'asc' },
    })

    return NextResponse.json({ rates })
  } catch (error) {
    console.error('Shipping rates GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await verifySuperadminSession(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, price, minDays, maxDays, freeAbove } = body

    if (!name || price === undefined) {
      return NextResponse.json(
        { error: 'name and price are required' },
        { status: 400 }
      )
    }

    const rate = await db.shippingRate.create({
      data: {
        zoneId: params.id,
        name,
        price,
        minDays: minDays ?? 1,
        maxDays: maxDays ?? 5,
        freeAbove: freeAbove ?? null,
      },
    })

    return NextResponse.json({ rate }, { status: 201 })
  } catch (error) {
    console.error('Shipping rates POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
