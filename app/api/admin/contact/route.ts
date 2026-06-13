export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdminSession } from '@/lib/admin-auth'
import { isSuperadmin } from '@/lib/vendor-auth'

const VALID_STATUSES = ['new', 'read', 'archived'] as const

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminSession(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!isSuperadmin(admin)) {
      return NextResponse.json({ error: 'Superadmin only' }, { status: 403 })
    }

    const statusParam = req.nextUrl.searchParams.get('status')
    const where =
      statusParam && (VALID_STATUSES as readonly string[]).includes(statusParam)
        ? { status: statusParam }
        : {}

    const messages = await db.contactMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Contact messages GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
