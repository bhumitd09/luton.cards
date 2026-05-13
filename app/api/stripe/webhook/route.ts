import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-08-16' })

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    return NextResponse.json({ error: 'Webhook signature failed' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.orderId

    if (orderId) {
      // Update order status to paid
      await db.order.update({
        where: { id: orderId },
        data: { status: 'paid' },
      })

      // Decrement stock for each ordered item
      const order = await db.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      })

      if (order) {
        for (const item of order.items) {
          if (item.productId) {
            await db.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } },
            }).catch(() => {}) // ignore if product deleted
          }
        }
      }
    }
  }

  return NextResponse.json({ received: true })
}
