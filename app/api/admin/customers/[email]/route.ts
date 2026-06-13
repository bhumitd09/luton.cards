import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdminSession } from '@/lib/admin-auth'
import { isSuperadmin } from '@/lib/vendor-auth'

export const dynamic = 'force-dynamic'

/**
 * Customer profile by email. Superadmin only.
 *
 *  GET   → the CustomerProfile (notes/tags/blocked) + their full order history
 *          + lifetime totals. Profile is null if none created yet.
 *  PATCH → upsert the profile: { name?, adminNotes?, tags?, blocked? }.
 *
 * Keyed by email so it covers guests + registered customers alike.
 */
function decodeEmail(raw: string): string {
  try { return decodeURIComponent(raw).trim().toLowerCase() } catch { return raw.trim().toLowerCase() }
}

export async function GET(req: NextRequest, { params }: { params: { email: string } }) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isSuperadmin(admin)) return NextResponse.json({ error: 'Superadmin only' }, { status: 403 })

  const email = decodeEmail(params.email)
  const [profile, orders] = await Promise.all([
    db.customerProfile.findUnique({ where: { email } }),
    db.order.findMany({
      where: { email },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const totalSpent = orders
    .filter(o => ['paid', 'shipped', 'delivered'].includes(o.status))
    .reduce((s, o) => s + o.total, 0)

  return NextResponse.json({
    email,
    profile,
    orders,
    stats: {
      totalOrders: orders.length,
      totalSpent,
      firstOrderAt: orders.length ? orders[orders.length - 1].createdAt : null,
      lastOrderAt: orders.length ? orders[0].createdAt : null,
    },
  })
}

export async function PATCH(req: NextRequest, { params }: { params: { email: string } }) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isSuperadmin(admin)) return NextResponse.json({ error: 'Superadmin only' }, { status: 403 })

  const email = decodeEmail(params.email)
  const body = await req.json().catch(() => ({}))

  const data: { name?: string | null; adminNotes?: string | null; tags?: string[]; blocked?: boolean } = {}
  if (typeof body.name === 'string') data.name = body.name.trim() || null
  if (typeof body.adminNotes === 'string') data.adminNotes = body.adminNotes.trim() || null
  if (Array.isArray(body.tags)) {
    data.tags = body.tags.filter((t: unknown): t is string => typeof t === 'string').map((t: string) => t.trim()).filter(Boolean)
  }
  if (typeof body.blocked === 'boolean') data.blocked = body.blocked

  const profile = await db.customerProfile.upsert({
    where: { email },
    update: data,
    create: { email, ...data, tags: data.tags ?? [] },
  })

  return NextResponse.json({ profile })
}
