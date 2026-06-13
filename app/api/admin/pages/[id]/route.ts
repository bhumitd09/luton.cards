import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdminSession } from '@/lib/admin-auth'
import { isSuperadmin } from '@/lib/vendor-auth'
import { slugify } from '@/lib/slug'

/**
 * Single CMS page read / update / delete. Superadmin only. See sibling route
 * file for the full rationale.
 */

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdminSession(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!isSuperadmin(admin)) {
      return NextResponse.json({ error: 'Superadmin only' }, { status: 403 })
    }

    const page = await db.page.findUnique({ where: { id: params.id } })
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    return NextResponse.json({ page })
  } catch (error) {
    console.error('Page GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdminSession(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!isSuperadmin(admin)) {
      return NextResponse.json({ error: 'Superadmin only' }, { status: 403 })
    }

    const { id } = params
    const body = await req.json()

    const existing = await db.page.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}

    if (body.title !== undefined) {
      const title = String(body.title).trim()
      if (!title) {
        return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 })
      }
      updateData.title = title
    }
    if (body.body !== undefined) updateData.body = String(body.body)
    if (body.published !== undefined) updateData.published = Boolean(body.published)
    if (body.slug !== undefined) {
      const slug = slugify(body.slug)
      if (!slug) {
        return NextResponse.json({ error: 'Slug cannot be empty' }, { status: 400 })
      }
      updateData.slug = slug
    }

    const page = await db.page.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ page })
  } catch (error: unknown) {
    const err = error as { code?: string }
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'A page with that slug already exists' }, { status: 409 })
    }
    console.error('Page PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdminSession(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!isSuperadmin(admin)) {
      return NextResponse.json({ error: 'Superadmin only' }, { status: 403 })
    }

    const { id } = params

    const existing = await db.page.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    await db.page.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Page DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
