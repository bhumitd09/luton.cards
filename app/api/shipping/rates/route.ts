import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const country = searchParams.get('country') || 'GB'
    const total = parseFloat(searchParams.get('total') || '0')

    // Find a zone that includes the country or uses wildcard "*"
    const zones = await db.shippingZone.findMany({
      where: { active: true },
      include: {
        rates: {
          where: { active: true },
          orderBy: { price: 'asc' },
        },
      },
    })

    // Prefer exact country match over wildcard
    let matchedZone = zones.find(z => z.countries.includes(country))
    if (!matchedZone) {
      matchedZone = zones.find(z => z.countries.includes('*'))
    }

    if (!matchedZone) {
      return NextResponse.json({ rates: [] })
    }

    const rates = matchedZone.rates.map(rate => {
      const isFree = rate.freeAbove !== null && rate.freeAbove !== undefined && total >= rate.freeAbove
      return {
        id: rate.id,
        name: isFree ? `${rate.name} (FREE)` : rate.name,
        price: isFree ? 0 : rate.price,
        minDays: rate.minDays,
        maxDays: rate.maxDays,
      }
    })

    return NextResponse.json({ rates })
  } catch (error) {
    console.error('Public shipping rates GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
