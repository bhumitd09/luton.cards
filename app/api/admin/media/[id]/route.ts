import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdminSession } from '@/lib/admin-auth'
import { storage, keyFromUrl } from '@/lib/storage'

// Vendors may only act on their own uploads. Superadmin may act on any
// (including legacy null-vendor rows).
function canManage(admin: { userId: string; role: string }, media: { vendorId: string | null }): boolean {
  if (admin.role === 'superadmin') return true
  return media.vendorId === admin.userId
}

// DELETE /api/admin/media/[id] — delete media record AND the underlying file.
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await verifyAdminSession(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const media = await db.media.findUnique({ where: { id: params.id } })
    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }
    if (!canManage(admin, media)) {
      return NextResponse.json({ error: 'You can only delete your own media' }, { status: 403 })
    }

    await db.media.delete({ where: { id: params.id } })

    // Also delete the blob from storage so we don't leak orphaned files.
    // Only deletes files we own (keyFromUrl returns null for external URLs).
    const key = keyFromUrl(media.url)
    if (key) {
      await storage().delete(key).catch(err =>
        console.error('Media file delete failed (row already removed):', err),
      )
    }

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
    const admin = await verifyAdminSession(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { alt } = body

    const media = await db.media.findUnique({ where: { id: params.id } })
    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }
    if (!canManage(admin, media)) {
      return NextResponse.json({ error: 'You can only edit your own media' }, { status: 403 })
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
