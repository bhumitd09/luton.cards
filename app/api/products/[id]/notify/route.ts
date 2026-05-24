import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCustomerFromRequest } from '@/lib/customer-auth'

/**
 * Subscribe to back-in-stock notifications for a product.
 *
 * GET  /api/products/[id]/notify  — boolean check if current customer is subscribed
 * POST /api/products/[id]/notify  — subscribe current customer
 * DELETE /api/products/[id]/notify — unsubscribe
 *
 * All require login (per UX decision: account-required for everything customer-side).
 */

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getCustomerFromRequest(req)
  if (!auth) return NextResponse.json({ subscribed: false, authenticated: false })

  const existing = await db.stockNotification.findUnique({
    where: { userId_productId: { userId: auth.userId, productId: params.id } },
  })
  return NextResponse.json({
    subscribed: !!existing && existing.notifiedAt === null,
    authenticated: true,
  })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getCustomerFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify product exists + is out of stock (otherwise no point subscribing)
  const product = await db.product.findUnique({ where: { id: params.id } })
  if (!product || !product.active) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }
  if (product.stock > 0) {
    return NextResponse.json({ error: 'Product is in stock — no need to subscribe' }, { status: 400 })
  }

  // Get user's current email (snapshot in case they delete account later)
  const user = await db.user.findUnique({ where: { id: auth.userId }, select: { email: true } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Upsert: if they already have a row (maybe previously notified), reset notifiedAt so they get a fresh alert
  const sub = await db.stockNotification.upsert({
    where: { userId_productId: { userId: auth.userId, productId: params.id } },
    update: { notifiedAt: null, email: user.email },
    create: {
      userId: auth.userId,
      productId: params.id,
      email: user.email,
    },
  })

  return NextResponse.json({ ok: true, subscription: sub }, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getCustomerFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await db.stockNotification
    .delete({ where: { userId_productId: { userId: auth.userId, productId: params.id } } })
    .catch(() => null)

  return NextResponse.json({ ok: true })
}
