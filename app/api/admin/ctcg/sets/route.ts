import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/admin-auth'
import { listSets, CtcgError } from '@/lib/ctcg'

export const dynamic = 'force-dynamic'

/** GET /api/admin/ctcg/sets?tcg= — sets for a game. */
export async function GET(req: NextRequest) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tcg = new URL(req.url).searchParams.get('tcg') || ''
  if (!tcg) return NextResponse.json({ error: 'tcg is required' }, { status: 400 })
  try {
    return NextResponse.json(await listSets(tcg))
  } catch (err) {
    if (err instanceof CtcgError) return NextResponse.json({ error: err.message }, { status: err.status })
    console.error('CTCG sets error:', err)
    return NextResponse.json({ error: 'Card database error' }, { status: 500 })
  }
}
