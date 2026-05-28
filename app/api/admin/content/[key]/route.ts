import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdminSession } from '@/lib/admin-auth'
import { isSensitiveContentKey } from '@/lib/content-keys'

/**
 * Admin Content CRUD by key.
 *
 * Auth model:
 *  - All operations require a valid admin session AND superadmin role.
 *    Vendors don't get to touch global brand content via the inline editor.
 *  - Even superadmin can't write to "sensitive" keys (instagram_access_token,
 *    collecttcg_*, contact_submission_*, *_secret, *_token, etc.) through
 *    this generic endpoint — those have dedicated, audited code paths.
 *
 * Closes Critical findings C7 (data leak) and C8 (vendor can deface).
 */

function isSuperadmin(payload: { role: string } | null): boolean {
  return !!payload && payload.role === 'superadmin'
}

export async function GET(req: NextRequest, { params }: { params: { key: string } }) {
  try {
    const admin = await verifyAdminSession(req)
    if (!isSuperadmin(admin)) {
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
    const admin = await verifyAdminSession(req)
    if (!isSuperadmin(admin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (isSensitiveContentKey(params.key)) {
      return NextResponse.json(
        { error: 'This key is managed by a dedicated endpoint and cannot be written here.' },
        { status: 403 },
      )
    }

    const body = await req.json()
    const { value, type, label } = body

    if (value === undefined || typeof value !== 'string') {
      return NextResponse.json({ error: 'value (string) is required' }, { status: 400 })
    }

    const content = await db.content.upsert({
      where: { key: params.key },
      update: {
        value,
        ...(typeof type === 'string' ? { type } : {}),
        ...(typeof label === 'string' ? { label } : {}),
      },
      create: {
        key: params.key,
        value,
        type: typeof type === 'string' ? type : 'text',
        label: typeof label === 'string' ? label : params.key,
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
    const admin = await verifyAdminSession(req)
    if (!isSuperadmin(admin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (isSensitiveContentKey(params.key)) {
      return NextResponse.json(
        { error: 'This key cannot be deleted via the generic editor.' },
        { status: 403 },
      )
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
