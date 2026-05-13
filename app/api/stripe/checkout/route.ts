import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-08-16' })

// POST /api/stripe/checkout
// Body: { items: [{productId, productName, price, quantity}], customerEmail, customerName, shippingCost?, shippingMethodName?, orderId? }
// Creates a Stripe Checkout session with line items (+ optional shipping line item)
// Returns { url } — the Stripe hosted checkout URL
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { items, customerEmail, customerName, shippingCost, shippingMethodName, metadata = {} } = body

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item: { productId?: string; productName: string; price: number; quantity: number }) => ({
    price_data: {
      currency: 'gbp',
      product_data: {
        name: item.productName,
        metadata: { productId: item.productId || '' },
      },
      unit_amount: Math.round(item.price * 100), // pence
    },
    quantity: item.quantity,
  }))

  // Add shipping as a line item when cost > 0
  if (typeof shippingCost === 'number' && shippingCost > 0) {
    lineItems.push({
      price_data: {
        currency: 'gbp',
        product_data: {
          name: `Shipping — ${shippingMethodName || 'Standard'}`,
        },
        unit_amount: Math.round(shippingCost * 100),
      },
      quantity: 1,
    })
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    customer_email: customerEmail,
    metadata: { customerName, ...metadata },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout`,
  })

  return NextResponse.json({ url: session.url, sessionId: session.id })
}
