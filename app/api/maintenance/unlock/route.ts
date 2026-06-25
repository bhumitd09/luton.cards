import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { enforceRateLimit } from '@/lib/rate-limit'
import { MAINT_BYPASS_COOKIE, maintenanceBypassToken } from '@/lib/maintenance-token'

/**
 * POST /api/maintenance/unlock — { password }
 *
 * Checks the password against the back-office "site lock" password and, on a
 * match, sets the signed bypass cookie so this visitor can see the live site
 * while it's locked. Rate limited to slow guessing.
 */
export async function POST(req: NextRequest) {
  const block = enforceRateLimit(req, { bucket: 'maintenance-unlock', max: 10, windowMs: 15 * 60_000 })
  if (block) return block

  const body = await req.json().catch(() => ({}))
  const password = typeof body.password === 'string' ? body.password : ''
  if (!password) return NextResponse.json({ error: 'Password is required.' }, { status: 400 })

  const row = await db.content.findUnique({ where: { key: 'maintenance_password' }, select: { value: true } })
  const stored = row?.value || ''

  if (!stored || password !== stored) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(MAINT_BYPASS_COOKIE, await maintenanceBypassToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
  return res
}
