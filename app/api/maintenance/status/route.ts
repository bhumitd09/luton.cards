import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/maintenance/status — public, tiny. Read by the edge middleware
 * (which can't touch the DB) to decide whether the site lock is on. Returns
 * only the flag + public copy — never the bypass password.
 */
export async function GET() {
  try {
    const rows = await db.content.findMany({
      where: { key: { in: ['maintenance_enabled', 'maintenance_title', 'maintenance_message'] } },
      select: { key: true, value: true },
    })
    const map = new Map(rows.map(r => [r.key, r.value]))
    return NextResponse.json({
      enabled: map.get('maintenance_enabled') === 'true',
      title: map.get('maintenance_title') || null,
      message: map.get('maintenance_message') || null,
    })
  } catch {
    // Fail open — never lock the site on a read error.
    return NextResponse.json({ enabled: false })
  }
}
