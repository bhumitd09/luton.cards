export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/admin-auth'

export async function GET(req: NextRequest) {
  try {
    const admin = getAdminFromRequest(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

export async function POST(req: NextRequest) {
  try {
    const admin = getAdminFromRequest(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
