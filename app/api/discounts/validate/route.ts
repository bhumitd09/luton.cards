import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const totalParam = searchParams.get('total')

    if (!code) {
      return NextResponse.json({ valid: false, reason: 'No code provided' })
    }

    const total = totalParam ? parseFloat(totalParam) : 0

    const discount = await db.discount.findUnique({
      where: { code: code.trim().toUpperCase() },
    })

    if (!discount) {
      return NextResponse.json({ valid: false, reason: 'Invalid discount code' })
    }

    if (!discount.active) {
      return NextResponse.json({ valid: false, reason: 'This discount code is inactive' })
    }

    if (discount.expiresAt && discount.expiresAt < new Date()) {
      return NextResponse.json({ valid: false, reason: 'This discount code has expired' })
    }

    if (discount.maxUses != null && discount.uses >= discount.maxUses) {
      return NextResponse.json({ valid: false, reason: 'This discount code has reached its usage limit' })
    }

    if (discount.minOrder != null && total < discount.minOrder) {
      return NextResponse.json({
        valid: false,
        reason: `Minimum order of £${discount.minOrder.toFixed(2)} required`,
      })
    }

    let savings: number
    if (discount.type === 'percentage') {
      savings = (total * discount.value) / 100
    } else {
      savings = Math.min(discount.value, total)
    }

    return NextResponse.json({
      valid: true,
      discount: {
        type: discount.type,
        value: discount.value,
        savings: Math.round(savings * 100) / 100,
      },
    })
  } catch (error) {
    console.error('Discount validate error:', error)
    return NextResponse.json({ valid: false, reason: 'Server error' })
  }
}
