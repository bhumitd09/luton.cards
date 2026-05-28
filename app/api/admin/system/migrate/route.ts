import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { verifyAdminSession } from '@/lib/admin-auth'
import { isSuperadmin } from '@/lib/vendor-auth'

const execAsync = promisify(exec)

/**
 * Manually run pending Prisma migrations. Superadmin only — previously any
 * vendor could trigger schema changes against the prod DB. We also no
 * longer echo raw stderr/stdout (which can leak SQL paths and table names);
 * production gets a generic boolean + summary instead.
 */
export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdminSession(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!isSuperadmin(admin)) {
      return NextResponse.json({ error: 'Superadmin only' }, { status: 403 })
    }

    try {
      const { stdout, stderr } = await execAsync('npx prisma migrate deploy', {
        cwd: process.cwd(),
        timeout: 60_000,
      })

      // Only echo the raw output in non-production for debugging. In prod
      // we deliberately return a short summary so SQL/file paths don't
      // leak via the response body.
      const safe = process.env.NODE_ENV === 'production'
        ? { success: true, output: 'Migrations applied.' }
        : { success: true, output: [stdout, stderr].filter(Boolean).join('\n').trim() }
      return NextResponse.json(safe)
    } catch (e: unknown) {
      console.error('Migration error:', e)
      return NextResponse.json(
        process.env.NODE_ENV === 'production'
          ? { success: false, output: 'Migration failed. Check server logs.' }
          : { success: false, output: String(e) },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error('Migration handler error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
