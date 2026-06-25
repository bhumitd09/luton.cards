import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/admin-auth'
import { psaConfigured } from '@/lib/psa'

export const dynamic = 'force-dynamic'

/** GET /api/admin/psa/status — whether the PSA API token is configured. */
export async function GET(req: NextRequest) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ configured: psaConfigured() })
}
