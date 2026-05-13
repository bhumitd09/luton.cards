export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/admin-auth'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = getAdminFromRequest(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { approved, featured, name, location, rating, body: reviewBody, productRef } = body

    const data: {
      approved?: boolean
      featured?: boolean
      name?: string
      location?: string | null
      rating?: number
      body?: string
      productRef?: string | null
    } = {}
    if (approved !== undefined) data.approved = approved
    if (featured !== undefined) data.featured = featured
    if (name !== undefined) data.name = name
    if (location !== undefined) data.location = location ?? null
    if (rating !== undefined) data.rating = parseInt(rating, 10)
    if (reviewBody !== undefined) data.body = reviewBody
    if (productRef !== undefined) data.productRef = productRef ?? null

    const review = await db.review.update({
      where: { id: params.id },
      data,
    })

    return NextResponse.json({ review })
  } catch (error) {
    console.error('Review PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = getAdminFromRequest(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await db.review.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Review DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
