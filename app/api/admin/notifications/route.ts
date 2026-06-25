import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

/**
 * GET  /api/admin/notifications        → recent notifications + unread count.
 * POST /api/admin/notifications        → { id } mark one read, or { all:true }
 *                                        mark every notification read.
 *
 * The feed is store-wide (small team) so any authenticated admin can read it
 * and clear it. Vendors see it too — it's operational, not customer PII.
 */
export async function GET(req: NextRequest) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [notifications, unread] = await Promise.all([
    db.notification.findMany({ orderBy: { createdAt: 'desc' }, take: 30 }),
    db.notification.count({ where: { read: false } }),
  ])
  return NextResponse.json({ notifications, unread })
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  if (body?.all === true) {
    await db.notification.updateMany({ where: { read: false }, data: { read: true } })
    return NextResponse.json({ ok: true })
  }
  if (typeof body?.id === 'string') {
    await db.notification.updateMany({ where: { id: body.id }, data: { read: true } })
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: 'Provide { id } or { all: true }' }, { status: 400 })
}
