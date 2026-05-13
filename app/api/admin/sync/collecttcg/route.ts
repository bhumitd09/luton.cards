export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/admin-auth'
import { getCollectTCGSettings, fetchCollectTCGProducts, syncProducts } from '@/lib/collecttcg'

export async function POST(req: NextRequest) {
  try {
    const admin = getAdminFromRequest(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await getCollectTCGSettings()
    if (!settings) {
      return NextResponse.json(
        { error: 'CollectTCG not configured. Add API URL and API Key in Integrations settings.' },
        { status: 400 }
      )
    }

    const products = await fetchCollectTCGProducts(settings.apiUrl, settings.apiKey)
    const result = await syncProducts(products)

    return NextResponse.json(result)
  } catch (error) {
    console.error('CollectTCG sync error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const admin = getAdminFromRequest(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const logs = await db.syncLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({ logs })
  } catch (error) {
    console.error('CollectTCG logs GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
