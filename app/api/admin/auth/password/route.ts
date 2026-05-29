import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { verifyAdminSession } from '@/lib/admin-auth'

// PUT /api/admin/auth/password
// Body: { currentPassword, newPassword }
export async function PUT(req: NextRequest) {
  try {
    const admin = await verifyAdminSession(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'currentPassword and newPassword are required' }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 })
    }

    const adminUser = await db.adminUser.findUnique({ where: { id: admin.userId } })
    if (!adminUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const passwordValid = await bcrypt.compare(currentPassword, adminUser.passwordHash)
    if (!passwordValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    }

    const newHash = await bcrypt.hash(newPassword, 12)

    // Bump tokenVersion to invalidate every existing session for this admin,
    // including the cookie that issued this request. The front-end should
    // redirect to /admin/login after a successful password change.
    await db.adminUser.update({
      where: { id: admin.userId },
      data: {
        passwordHash: newHash,
        tokenVersion: { increment: 1 },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Password change error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
