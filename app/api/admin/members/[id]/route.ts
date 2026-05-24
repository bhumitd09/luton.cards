import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/admin-auth'
import { isSuperadmin } from '@/lib/vendor-auth'

/**
 * /api/admin/members/[id]
 *
 * PUT    → update name, role, commissionRate, payoutNotes, avatarUrl, active
 *          + optional `password` field to rotate their login
 * DELETE → soft-delete (active=false). We never hard delete because OrderItems
 *          carry a vendorId FK and we want historical payout records preserved.
 *
 * Superadmin only. Member cannot demote themselves (avoid lockout).
 */

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = getAdminFromRequest(req)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isSuperadmin(admin)) {
      return NextResponse.json({ error: 'Superadmin only' }, { status: 403 })
    }

    const existing = await db.adminUser.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    const body = await req.json()
    const {
      name,
      role,
      commissionRate,
      payoutNotes,
      avatarUrl,
      active,
      password,
    } = body

    // Self-protection: can't demote yourself out of superadmin (would lock you
    // out of the very page that lets you set it back).
    if (existing.id === admin.userId && role && role !== 'superadmin') {
      return NextResponse.json(
        { error: 'You cannot remove your own superadmin role. Ask another superadmin to do it.' },
        { status: 400 }
      )
    }

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name?.trim() || null
    if (role !== undefined) data.role = role === 'superadmin' ? 'superadmin' : 'vendor'
    if (commissionRate !== undefined) {
      const n = Number(commissionRate)
      if (!Number.isFinite(n)) {
        return NextResponse.json({ error: 'commissionRate must be a number' }, { status: 400 })
      }
      data.commissionRate = Math.max(0, Math.min(100, n))
    }
    if (payoutNotes !== undefined) data.payoutNotes = payoutNotes?.trim() || null
    if (avatarUrl !== undefined) data.avatarUrl = avatarUrl?.trim() || null
    if (active !== undefined) data.active = !!active

    if (password) {
      if (typeof password !== 'string' || password.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
      }
      data.passwordHash = await bcrypt.hash(password, 12)
    }

    const member = await db.adminUser.update({
      where: { id: params.id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        commissionRate: true,
        payoutNotes: true,
        avatarUrl: true,
        active: true,
      },
    })

    return NextResponse.json({ member })
  } catch (err) {
    console.error('Member PUT error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = getAdminFromRequest(req)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isSuperadmin(admin)) {
      return NextResponse.json({ error: 'Superadmin only' }, { status: 403 })
    }

    if (params.id === admin.userId) {
      return NextResponse.json(
        { error: 'You cannot delete your own account.' },
        { status: 400 }
      )
    }

    const existing = await db.adminUser.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    // Soft delete: keep the row so historical OrderItems still resolve their
    // vendorId. Sets active=false so they can't log in.
    const member = await db.adminUser.update({
      where: { id: params.id },
      data: { active: false },
      select: { id: true, active: true },
    })

    return NextResponse.json({ member, soft: true })
  } catch (err) {
    console.error('Member DELETE error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
