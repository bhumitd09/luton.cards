import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Track whether we've warmed the DB pool this process lifetime
let warmed = false

export async function GET() {
  // Eagerly open the Prisma connection on the first health check so the
  // first user-facing request doesn't pay the connect-on-first-query tax.
  // Railway hits this endpoint during startup before routing traffic.
  if (!warmed) {
    try {
      await db.$connect()
      await db.$queryRaw`SELECT 1`
      warmed = true
    } catch (err) {
      return NextResponse.json(
        { status: 'warming', error: err instanceof Error ? err.message : 'db unavailable' },
        { status: 503 }
      )
    }
  }

  return NextResponse.json({ status: 'ok', warmed, timestamp: new Date() })
}
