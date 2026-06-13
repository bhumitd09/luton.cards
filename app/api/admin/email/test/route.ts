import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/admin-auth'
import { isSuperadmin } from '@/lib/vendor-auth'
import { sendAdminOrderNotification } from '@/lib/email'
import { enforceRateLimit } from '@/lib/rate-limit'

// Superadmin-only and rate-limited so a vendor (or compromised vendor
// session) can't spam the admin inbox or burn Resend quota.
export async function POST(req: NextRequest) {
  const admin = await verifyAdminSession(req)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!isSuperadmin(admin)) {
    return NextResponse.json({ error: 'Superadmin only' }, { status: 403 })
  }
  const block = enforceRateLimit(req, {
    bucket: 'admin-email-test',
    keyParts: [admin.userId],
    max: 3,
    windowMs: 60_000,
  })
  if (block) return block

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ sent: false, reason: 'RESEND_API_KEY is not configured' })
  }

  try {
    await sendAdminOrderNotification({
      orderId: 'TEST000000001',
      customerName: 'Test Customer',
      customerEmail: 'test@example.com',
      items: [
        { productName: 'Charizard Holo (Test)', quantity: 1, price: 9.99 },
        { productName: 'Pikachu Base Set (Test)', quantity: 2, price: 4.99 },
      ],
      subtotal: 19.97,
      shippingCost: 3.99,
      discount: 0,
      total: 23.96,
      shippingMethod: 'Royal Mail Tracked 48',
      shippingAddress: '123 Test Street, London, EC1A 1BB',
    })
    return NextResponse.json({ sent: true })
  } catch (error) {
    console.error('Test email error:', error)
    // Surface the actual reason (unverified sending domain, missing From
    // address, etc.) so the admin knows what to fix.
    const reason = error instanceof Error ? error.message : 'Failed to send test email'
    return NextResponse.json({ sent: false, reason })
  }
}
