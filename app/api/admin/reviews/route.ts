export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdminSession } from '@/lib/admin-auth'
import { isSuperadmin } from '@/lib/vendor-auth'

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminSession(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // Reviews are store-wide and contain reviewer PII (name + location);
    // a vendor must not be able to enumerate them.
    if (!isSuperadmin(admin)) {
      return NextResponse.json({ error: 'Superadmin only' }, { status: 403 })
    }

    const reviews = await db.review.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error('Reviews GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Admin-created reviews. Superadmin only — previously any vendor could
 * fabricate verified-purchase reviews on their own products via this
 * endpoint, bypassing the public review moderation flow.
 */
export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdminSession(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!isSuperadmin(admin)) {
      return NextResponse.json({ error: 'Superadmin only' }, { status: 403 })
    }

    const body = await req.json()
    const { name, location, rating, body: reviewBody, productRef, approved, featured } = body

    if (!name || !reviewBody) {
      return NextResponse.json({ error: 'name and body are required' }, { status: 400 })
    }

    const review = await db.review.create({
      data: {
        name,
        location: location ?? null,
        rating: rating !== undefined ? parseInt(rating, 10) : 5,
        body: reviewBody,
        productRef: productRef ?? null,
        approved: approved ?? false,
        featured: featured ?? false,
      },
    })

    return NextResponse.json({ review }, { status: 201 })
  } catch (error) {
    console.error('Reviews POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
