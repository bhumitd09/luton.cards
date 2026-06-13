import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/admin-auth'
import { isSuperadmin } from '@/lib/vendor-auth'
import { paymentProvidersStatus, activeProviderName } from '@/lib/payments'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/payments/status — superadmin only.
 *
 * Returns which of the two supported gateways (Stripe / Square) is active and
 * whether each is fully configured. Reports env-var presence as booleans only
 * — never the secret values themselves.
 */
export async function GET(req: NextRequest) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isSuperadmin(admin)) {
    return NextResponse.json({ error: 'Superadmin only' }, { status: 403 })
  }

  return NextResponse.json({
    active: activeProviderName(),
    providers: paymentProvidersStatus(),
  })
}
