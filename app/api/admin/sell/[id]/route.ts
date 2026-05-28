import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdminSession } from '@/lib/admin-auth'
import { isSuperadmin } from '@/lib/vendor-auth'

const VALID_STATUSES = new Set(['new', 'reviewing', 'offered', 'accepted', 'declined', 'closed'])

/**
 * Single sell-back submission. Superadmin only — contains seller PII.
 */

async function requireSuperadmin(req: NextRequest) {
  const admin = await verifyAdminSession(req)
  if (!admin) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  if (!isSuperadmin(admin)) {
    return { error: NextResponse.json({ error: 'Superadmin only' }, { status: 403 }) }
  }
  return { admin }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireSuperadmin(req)
  if (guard.error) return guard.error

  try {
    const submission = await db.sellSubmission.findUnique({ where: { id: params.id } })
    if (!submission) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ submission })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireSuperadmin(req)
  if (guard.error) return guard.error

  let body: { status?: string; adminNotes?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const data: Record<string, unknown> = {}
  if (typeof body.status === 'string') {
    if (!VALID_STATUSES.has(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    data.status = body.status
  }
  if (typeof body.adminNotes === 'string') data.adminNotes = body.adminNotes

  try {
    const submission = await db.sellSubmission.update({ where: { id: params.id }, data })
    return NextResponse.json({ submission })
  } catch {
    return NextResponse.json({ error: 'Could not update' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireSuperadmin(req)
  if (guard.error) return guard.error
  try {
    await db.sellSubmission.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Could not delete' }, { status: 500 })
  }
}
