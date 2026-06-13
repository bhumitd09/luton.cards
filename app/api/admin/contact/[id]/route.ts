export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdminSession } from '@/lib/admin-auth'
import { isSuperadmin } from '@/lib/vendor-auth'

const VALID_STATUSES = ['new', 'read', 'archived'] as const
type Status = (typeof VALID_STATUSES)[number]

export async function PATCH(
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

    const body = await req.json()
    const { status } = body as { status?: string }

    if (!status || !(VALID_STATUSES as readonly string[]).includes(status)) {
      return NextResponse.json(
        { error: 'status must be one of new, read, archived' },
        { status: 400 }
      )
    }

    const message = await db.contactMessage.update({
      where: { id: params.id },
      data: { status: status as Status },
    })

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Contact message PATCH error:', error)
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

    await db.contactMessage.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact message DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
