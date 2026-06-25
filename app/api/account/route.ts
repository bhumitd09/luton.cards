import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyCustomerSession } from '@/lib/customer-auth'

export async function GET(req: NextRequest) {
  const auth = await verifyCustomerSession(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.user.findUnique({
    where: { id: auth.userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      marketingOptIn: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      postcode: true,
      country: true,
      emailVerified: true,
      createdAt: true,
    },
  })

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  return NextResponse.json({ user })
}

export async function PATCH(req: NextRequest) {
  const auth = await verifyCustomerSession(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const data: Record<string, unknown> = {}
  const stringFields = ['name', 'phone', 'addressLine1', 'addressLine2', 'city', 'postcode', 'country']
  for (const field of stringFields) {
    if (typeof body[field] === 'string') {
      data[field] = (body[field] as string).trim() || null
    }
  }
  if (typeof body.marketingOptIn === 'boolean') data.marketingOptIn = body.marketingOptIn

  const user = await db.user.update({
    where: { id: auth.userId },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      marketingOptIn: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      postcode: true,
      country: true,
    },
  })

  return NextResponse.json({ user })
}
