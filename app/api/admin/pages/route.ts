import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdminSession } from '@/lib/admin-auth'
import { isSuperadmin } from '@/lib/vendor-auth'
import { slugify } from '@/lib/slug'

/**
 * Legal pages CMS (FAQ / Privacy / Terms / Cookies and any other static
 * content page). Superadmin only — these pages are store-wide and a vendor
 * must never be able to rewrite the terms of service.
 *
 * The public site reads published pages via /api/pages/[slug] and falls back
 * to hardcoded copy when no row exists, so deleting a page here is safe.
 */

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminSession(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!isSuperadmin(admin)) {
      return NextResponse.json({ error: 'Superadmin only' }, { status: 403 })
    }

    const pages = await db.page.findMany({
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ pages })
  } catch (error) {
    console.error('Pages GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdminSession(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!isSuperadmin(admin)) {
      return NextResponse.json({ error: 'Superadmin only' }, { status: 403 })
    }

    const body = await req.json()
    const { title } = body

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const slug = slugify(body.slug || title)
    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
    }

    const page = await db.page.create({
      data: {
        slug,
        title: title.trim(),
        body: typeof body.body === 'string' ? body.body : '',
        published: body.published === undefined ? true : Boolean(body.published),
      },
    })

    return NextResponse.json({ page }, { status: 201 })
  } catch (error: unknown) {
    const err = error as { code?: string }
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'A page with that slug already exists' }, { status: 409 })
    }
    console.error('Pages POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
