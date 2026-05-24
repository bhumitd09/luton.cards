import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { signAdminToken, getAdminFromRequest } from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const adminUser = await db.adminUser.findUnique({ where: { email } })

    if (!adminUser) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Soft-deleted / disabled members can't sign in. Their products stay live
    // until a superadmin reassigns or deactivates them.
    if (adminUser.active === false) {
      return NextResponse.json({ error: 'This account is disabled' }, { status: 403 })
    }

    const passwordValid = await bcrypt.compare(password, adminUser.passwordHash)

    if (!passwordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    await db.adminUser.update({
      where: { id: adminUser.id },
      data: { lastLogin: new Date() },
    })

    const token = signAdminToken({
      userId: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
    })

    const response = NextResponse.json({
      success: true,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
      },
    })

    response.cookies.set('luton_admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Auth POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const admin = getAdminFromRequest(req)

    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminUser = await db.adminUser.findUnique({
      where: { id: admin.userId },
      select: { id: true, email: true, name: true, role: true },
    })

    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ user: adminUser })
  } catch (error) {
    console.error('Auth GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.set('luton_admin_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  return response
}
