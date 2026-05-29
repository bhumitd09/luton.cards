import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifySuperadminSession } from '@/lib/admin-auth'

export async function GET(req: NextRequest) {
  try {
    const admin = await verifySuperadminSession(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const zones = await db.shippingZone.findMany({
      include: { rates: { orderBy: { price: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ zones })
  } catch (error) {
    console.error('Shipping zones GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verifySuperadminSession(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, countries } = body

    if (!name || !Array.isArray(countries)) {
      return NextResponse.json(
        { error: 'name and countries (array) are required' },
        { status: 400 }
      )
    }

    const zone = await db.shippingZone.create({
      data: { name, countries },
      include: { rates: true },
    })

    return NextResponse.json({ zone }, { status: 201 })
  } catch (error) {
    console.error('Shipping zones POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
