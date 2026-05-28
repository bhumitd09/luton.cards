import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { verifyAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminSession(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminUser = await db.adminUser.findUnique({
      where: { id: admin.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        lastLogin: true,
      },
    })

    if (!adminUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(adminUser)
  } catch (error) {
    console.error('Profile GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Update name / password. Password change bumps tokenVersion which
 * invalidates every existing session for this admin (incl. the one making
 * the request — front-end should re-authenticate).
 */
export async function PATCH(req: NextRequest) {
  try {
    const admin = await verifyAdminSession(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, currentPassword, newPassword } = body as {
      name?: string
      currentPassword?: string
      newPassword?: string
    }

    const adminUser = await db.adminUser.findUnique({
      where: { id: admin.userId },
    })

    if (!adminUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let newName: string | undefined
    let newPasswordHash: string | undefined

    if (name !== undefined && name.trim()) {
      newName = name.trim()
    }

    if (currentPassword && newPassword) {
      const valid = await bcrypt.compare(currentPassword, adminUser.passwordHash)
      if (!valid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
      }
      if (newPassword.length < 8) {
        return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 })
      }
      newPasswordHash = await bcrypt.hash(newPassword, 12)
    }

    if (!newName && !newPasswordHash) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    const updated = await db.adminUser.update({
      where: { id: admin.userId },
      data: {
        ...(newName !== undefined ? { name: newName } : {}),
        ...(newPasswordHash !== undefined ? {
          passwordHash: newPasswordHash,
          // Bump tokenVersion to invalidate every existing session.
          tokenVersion: { increment: 1 },
        } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        lastLogin: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Profile PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
