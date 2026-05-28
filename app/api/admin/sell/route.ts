import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdminSession } from '@/lib/admin-auth'
import { isSuperadmin } from '@/lib/vendor-auth'

/**
 * Sell-back submissions list. Superadmin only.
 *
 * Each SellSubmission contains the prospective seller's name, email, phone,
 * and image attachments — PII a vendor account has no business reading.
 * Closes part of Critical finding C6.
 */
export async function GET(req: NextRequest) {
  const admin = await verifyAdminSession(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isSuperadmin(admin)) {
    return NextResponse.json({ error: 'Superadmin only' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  try {
    const submissions = await db.sellSubmission.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ submissions })
  } catch (err) {
    console.error('Admin sell list error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
