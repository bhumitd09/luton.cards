import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/admin-auth'
import { getCard, ctcgGame, CtcgError } from '@/lib/ctcg'

export const dynamic = 'force-dynamic'

/** GET /api/admin/ctcg/card?tcg=&cardId= — full card details for the preview. */
export async function GET(req: NextRequest) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const sp = new URL(req.url).searchParams
  const tcg = sp.get('tcg') || ''
  const cardId = sp.get('cardId') || ''
  if (!tcg || !cardId) return NextResponse.json({ error: 'tcg and cardId are required' }, { status: 400 })
  try {
    const { card } = await getCard(tcg, cardId)
    return NextResponse.json({ card, suggestedGame: ctcgGame(tcg) })
  } catch (err) {
    if (err instanceof CtcgError) return NextResponse.json({ error: err.message }, { status: err.status })
    console.error('CTCG card error:', err)
    return NextResponse.json({ error: 'Card database error' }, { status: 500 })
  }
}
