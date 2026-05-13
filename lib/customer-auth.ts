import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.CUSTOMER_JWT_SECRET || 'luton-cards-customer-secret-change-in-prod'

export const CUSTOMER_TOKEN_COOKIE = 'luton_customer_token'

export interface CustomerJwtPayload {
  userId: string
  email: string
}

export function signCustomerToken(payload: CustomerJwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' })
}

export function verifyCustomerToken(token: string): CustomerJwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as CustomerJwtPayload
  } catch {
    return null
  }
}

export function getCustomerFromRequest(req: NextRequest): CustomerJwtPayload | null {
  const token = req.cookies.get(CUSTOMER_TOKEN_COOKIE)?.value
  if (!token) return null
  return verifyCustomerToken(token)
}
