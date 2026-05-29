import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { verifyAdminSession } from '@/lib/admin-auth'
import { isSuperadmin } from '@/lib/vendor-auth'

/**
 * /api/admin/members
 *
 * Superadmin-only endpoints for managing team / vendor accounts.
 * Vendors hit this in /admin/members to invite + configure their crew.
 *
 * GET   → list all AdminUsers + per-vendor product counts
 * POST  → create a new vendor account
 *
 * Per-member edits live at /api/admin/members/[id].
 */

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminSession(req)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isSuperadmin(admin)) {
      return NextResponse.json({ error: 'Superadmin only' }, { status: 403 })
    }

    const members = await db.adminUser.findMany({
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        commissionRate: true,
        payoutNotes: true,
        avatarUrl: true,
        active: true,
        createdAt: true,
        lastLogin: true,
        _count: { select: { products: true } },
      },
    })

    return NextResponse.json({ members })
  } catch (err) {
    console.error('Members GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdminSession(req)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isSuperadmin(admin)) {
      return NextResponse.json({ error: 'Superadmin only' }, { status: 403 })
    }

    const body = await req.json()
    const {
      email,
      name,
      password,
      role,
      commissionRate,
      payoutNotes,
      avatarUrl,
      active,
    } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'email and password are required' }, { status: 400 })
    }
    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }
    const resolvedRole = role === 'superadmin' ? 'superadmin' : 'vendor'
    const resolvedRate = typeof commissionRate === 'number'
      ? Math.max(0, Math.min(100, commissionRate))
      : 0

    const passwordHash = await bcrypt.hash(password, 12)

    const member = await db.adminUser.create({
      data: {
        email: String(email).trim().toLowerCase(),
        name: name?.trim() || null,
        passwordHash,
        role: resolvedRole,
        commissionRate: resolvedRate,
        payoutNotes: payoutNotes?.trim() || null,
        avatarUrl: avatarUrl?.trim() || null,
        active: active !== undefined ? !!active : true,
      },
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

    return NextResponse.json({ member }, { status: 201 })
  } catch (err: unknown) {
    console.error('Members POST error:', err)
    if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'A member with this email already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
