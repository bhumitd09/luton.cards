import { NextRequest, NextResponse } from 'next/server'
import { getAdminFromRequest } from '@/lib/admin-auth'
import { sendAdminOrderNotification } from '@/lib/email'

export async function POST(req: NextRequest) {
  const admin = getAdminFromRequest(req)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
    return NextResponse.json({ sent: false, reason: 'Failed to send test email' })
  }
}
