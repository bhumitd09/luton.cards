import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/admin-auth'

export async function GET(req: NextRequest, { params }: { params: { key: string } }) {
  try {
    const admin = getAdminFromRequest(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const content = await db.content.findUnique({ where: { key: params.key } })

    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    return NextResponse.json({ content })
  } catch (error) {
    console.error('Content GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { key: string } }) {
  try {
    const admin = getAdminFromRequest(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { value, type, label } = body

    if (value === undefined) {
      return NextResponse.json({ error: 'value is required' }, { status: 400 })
    }

    // Upsert semantics: PUT means "put this at this key" — create if missing,
    // update if present. Previously this returned 404 on missing rows, which
    // silently broke saves for any never-seeded key (e.g. instagram_access_token).
    const content = await db.content.upsert({
      where: { key: params.key },
      update: {
        value,
        ...(type !== undefined ? { type } : {}),
        ...(label !== undefined ? { label } : {}),
      },
      create: {
        key: params.key,
        value,
        type: type ?? 'text',
        label: label ?? params.key,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ content })
  } catch (error) {
    console.error('Content PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { key: string } }) {
  try {
    const admin = getAdminFromRequest(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existing = await db.content.findUnique({ where: { key: params.key } })
    if (!existing) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    await db.content.delete({ where: { key: params.key } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Content DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
