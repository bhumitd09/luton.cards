import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifySuperadminSession } from '@/lib/admin-auth'

export async function GET(req: NextRequest) {
  try {
    const admin = await verifySuperadminSession(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contentItems = await db.content.findMany({
      orderBy: { key: 'asc' },
    })

    return NextResponse.json({ content: contentItems })
  } catch (error) {
    console.error('Content GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verifySuperadminSession(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { key, value, type, label } = body

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'key and value are required' }, { status: 400 })
    }

    const content = await db.content.upsert({
      where: { key },
      create: {
        key,
        value,
        type: type ?? 'text',
        label: label ?? null,
      },
      update: {
        value,
        type: type ?? 'text',
        label: label !== undefined ? label : undefined,
      },
    })

    return NextResponse.json({ content }, { status: 200 })
  } catch (error) {
    console.error('Content POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
