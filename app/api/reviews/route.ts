export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const reviews = await db.review.findMany({
      where: { approved: true },
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error('Public reviews GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
