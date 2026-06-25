import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/admin-auth'
import { browseSet, CtcgError } from '@/lib/ctcg'

export const dynamic = 'force-dynamic'

/** GET /api/admin/ctcg/cards?tcg=&code=&page=&q= — browse cards in a set. */
export async function GET(req: NextRequest) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const sp = new URL(req.url).searchParams
  const tcg = sp.get('tcg') || ''
  const code = sp.get('code') || ''
  if (!tcg || !code) return NextResponse.json({ error: 'tcg and code are required' }, { status: 400 })
  const page = Math.max(1, parseInt(sp.get('page') || '1', 10) || 1)
  const q = sp.get('q') || ''
  try {
    return NextResponse.json(await browseSet(tcg, code, page, q))
  } catch (err) {
    if (err instanceof CtcgError) return NextResponse.json({ error: err.message }, { status: err.status })
    console.error('CTCG cards error:', err)
    return NextResponse.json({ error: 'Card database error' }, { status: 500 })
  }
}
