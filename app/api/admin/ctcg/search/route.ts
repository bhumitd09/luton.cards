import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/admin-auth'
import { searchByName, CtcgError } from '@/lib/ctcg'

export const dynamic = 'force-dynamic'

/** GET /api/admin/ctcg/search?q=&tcg=&page= — name search across the catalogue. */
export async function GET(req: NextRequest) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const sp = new URL(req.url).searchParams
  const q = (sp.get('q') || '').trim()
  if (!q) return NextResponse.json({ error: 'q is required' }, { status: 400 })
  const tcg = sp.get('tcg') || ''
  const page = Math.max(1, parseInt(sp.get('page') || '1', 10) || 1)
  try {
    return NextResponse.json(await searchByName(q, tcg, page))
  } catch (err) {
    if (err instanceof CtcgError) return NextResponse.json({ error: err.message }, { status: err.status })
    console.error('CTCG search error:', err)
    return NextResponse.json({ error: 'Card database error' }, { status: 500 })
  }
}
