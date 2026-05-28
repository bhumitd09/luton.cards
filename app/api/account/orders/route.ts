import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyCustomerSession } from '@/lib/customer-auth'

/**
 * Logged-in customer's order list.
 *
 * Only returns orders explicitly linked to their userId. Previously the
 * query OR'd on email too — but email isn't verified at signup, so anyone
 * who signed up with someone else's email would receive that person's
 * pre-signup guest-order history. Removing the email branch closes that
 * IDOR. (When we add email verification later we can opt-in to a
 * "claim historical guest orders" flow.)
 */
export async function GET(req: NextRequest) {
  const auth = await verifyCustomerSession(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orders = await db.order.findMany({
    where: { userId: auth.userId },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ orders })
}
