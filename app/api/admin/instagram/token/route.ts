import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdminSession } from '@/lib/admin-auth'
import { isSuperadmin } from '@/lib/vendor-auth'

export const dynamic = 'force-dynamic'

/**
 * PUT  /api/admin/instagram/token   — save (or replace) the IG access token
 * DELETE /api/admin/instagram/token — disconnect (clear the token)
 *
 * Why a dedicated route: the generic /api/admin/content/[key] PUT deliberately
 * 403s "sensitive" keys (anything matching instagram_access_token / _token_,
 * *_secret, etc.) so the public inline editor can't touch them. That guard
 * also blocked the Instagram admin page from ever saving its token. This route
 * is superadmin-only and writes the token (and its refreshed-at stamp) straight
 * to the Content table, which is the legitimate place to set it.
 */
export async function PUT(req: NextRequest) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isSuperadmin(admin)) {
    return NextResponse.json({ error: 'Superadmin only' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const token = typeof body?.token === 'string' ? body.token.trim() : ''
  if (!token) {
    return NextResponse.json({ error: 'token is required' }, { status: 400 })
  }

  const now = new Date().toISOString()
  await db.content.upsert({
    where: { key: 'instagram_access_token' },
    update: { value: token },
    create: { key: 'instagram_access_token', value: token, type: 'text', label: 'Instagram Access Token', updatedAt: new Date() },
  })
  await db.content.upsert({
    where: { key: 'instagram_token_refreshed_at' },
    update: { value: now },
    create: { key: 'instagram_token_refreshed_at', value: now, type: 'text', label: 'Instagram Token Refreshed At', updatedAt: new Date() },
  })

  return NextResponse.json({ ok: true, refreshedAt: now })
}

export async function DELETE(req: NextRequest) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isSuperadmin(admin)) {
    return NextResponse.json({ error: 'Superadmin only' }, { status: 403 })
  }

  await db.content.deleteMany({ where: { key: { in: ['instagram_access_token', 'instagram_token_refreshed_at'] } } })
  return NextResponse.json({ ok: true })
}
