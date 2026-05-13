import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/admin-auth'

// DELETE /api/admin/media/[id] — delete media record
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = getAdminFromRequest(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const media = await db.media.findUnique({ where: { id: params.id } })
    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    await db.media.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Media DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/admin/media/[id] — update alt text
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return PUT(req, { params })
}

// PUT /api/admin/media/[id] — update alt text
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = getAdminFromRequest(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { alt } = body

    const media = await db.media.findUnique({ where: { id: params.id } })
    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    const updated = await db.media.update({
      where: { id: params.id },
      data: { alt: typeof alt === 'string' ? alt.trim() || null : null },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Media PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
