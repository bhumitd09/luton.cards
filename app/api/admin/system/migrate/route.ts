import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { getAdminFromRequest } from '@/lib/admin-auth'

const execAsync = promisify(exec)

export async function POST(req: NextRequest) {
  try {
    const admin = getAdminFromRequest(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { stdout, stderr } = await execAsync('npx prisma migrate deploy', {
      cwd: process.cwd(),
      timeout: 60000,
    })

    const output = [stdout, stderr].filter(Boolean).join('\n').trim()

    return NextResponse.json({ success: true, output })
  } catch (error: unknown) {
    console.error('Migration error:', error)
    const err = error as { stdout?: string; stderr?: string; message?: string }
    const output = [err.stdout, err.stderr, err.message].filter(Boolean).join('\n').trim()
    return NextResponse.json({ success: false, output }, { status: 500 })
  }
}
