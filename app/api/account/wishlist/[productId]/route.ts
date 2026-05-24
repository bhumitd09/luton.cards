import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCustomerFromRequest } from '@/lib/customer-auth'

/** Lightweight "is this on my wishlist" check — used by product cards / PDP. */
export async function GET(req: NextRequest, { params }: { params: { productId: string } }) {
  const auth = getCustomerFromRequest(req)
  if (!auth) return NextResponse.json({ inWishlist: false, authenticated: false })

  const item = await db.wishlist.findUnique({
    where: { userId_productId: { userId: auth.userId, productId: params.productId } },
  })
  return NextResponse.json({ inWishlist: !!item, authenticated: true })
}

/** Remove from wishlist. Idempotent (404 not raised if missing). */
export async function DELETE(req: NextRequest, { params }: { params: { productId: string } }) {
  const auth = getCustomerFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await db.wishlist
    .delete({ where: { userId_productId: { userId: auth.userId, productId: params.productId } } })
    .catch(() => null)

  return NextResponse.json({ ok: true })
}
