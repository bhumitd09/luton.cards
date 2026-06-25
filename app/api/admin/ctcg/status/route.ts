import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/admin-auth'
import { ctcgConfigured } from '@/lib/ctcg'

export const dynamic = 'force-dynamic'

/** GET /api/admin/ctcg/status — is the card database connected? */
export async function GET(req: NextRequest) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ configured: ctcgConfigured() })
}
