import { NextRequest, NextResponse } from 'next/server'
import { verifySuperadminSession } from '@/lib/admin-auth'

export async function GET(req: NextRequest) {
  const admin = await verifySuperadminSession(req)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    resendConfigured: Boolean(process.env.RESEND_API_KEY),
  })
}
