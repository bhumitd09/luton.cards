export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { verifySuperadminSession } from '@/lib/admin-auth'
import { fetchCollectTCGProducts } from '@/lib/collecttcg'

export async function POST(req: NextRequest) {
  try {
    const admin = await verifySuperadminSession(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { apiUrl, apiKey } = body as { apiUrl: string; apiKey: string }

    if (!apiUrl || !apiKey) {
      return NextResponse.json({ connected: false, error: 'API URL and API Key are required' }, { status: 400 })
    }

    const normalised = apiUrl.replace(/\/$/, '')
    const products = await fetchCollectTCGProducts(normalised, apiKey)

    return NextResponse.json({ connected: true, productCount: products.length })
  } catch (error) {
    return NextResponse.json({
      connected: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    })
  }
}
