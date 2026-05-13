import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCustomerFromRequest } from '@/lib/customer-auth'

export async function GET(req: NextRequest) {
  const auth = getCustomerFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Match orders linked to userId OR matching the user's email (for orders placed
  // before signing up, where userId is null but the email matches).
  const user = await db.user.findUnique({ where: { id: auth.userId }, select: { email: true } })
  if (!user) return NextResponse.json({ orders: [] })

  const orders = await db.order.findMany({
    where: {
      OR: [
        { userId: auth.userId },
        { email: user.email },
      ],
    },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ orders })
}
