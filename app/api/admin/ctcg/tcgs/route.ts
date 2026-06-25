import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/admin-auth'
import { listTcgs, CtcgError } from '@/lib/ctcg'

export const dynamic = 'force-dynamic'

/** GET /api/admin/ctcg/tcgs — games available in the card database. */
export async function GET(req: NextRequest) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    return NextResponse.json(await listTcgs())
  } catch (err) {
    if (err instanceof CtcgError) return NextResponse.json({ error: err.message }, { status: err.status })
    console.error('CTCG tcgs error:', err)
    return NextResponse.json({ error: 'Card database error' }, { status: 500 })
  }
}
