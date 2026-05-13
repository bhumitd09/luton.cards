import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'luton-cards-admin-secret-change-in-prod'

export interface AdminJwtPayload {
  userId: string
  email: string
  role: string
}

export function signAdminToken(payload: AdminJwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyAdminToken(token: string): AdminJwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AdminJwtPayload
  } catch {
    return null
  }
}

export function getAdminFromRequest(req: NextRequest): AdminJwtPayload | null {
  const token = req.cookies.get('luton_admin_token')?.value
  if (!token) return null
  return verifyAdminToken(token)
}

export function requireAdmin(req: NextRequest): AdminJwtPayload {
  const admin = getAdminFromRequest(req)
  if (!admin) throw new Error('Unauthorized')
  return admin
}
