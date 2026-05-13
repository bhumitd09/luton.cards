import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/admin-auth'

export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
