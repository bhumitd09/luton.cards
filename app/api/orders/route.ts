import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendOrderConfirmation, sendAdminOrderNotification } from '@/lib/email'
import { getCustomerFromRequest } from '@/lib/customer-auth'
import { priceOrderLines, applyDiscountCode, buildOrderItemCreates, PricingError } from '@/lib/orders'

/**
 * POST /api/orders — guest or logged-in checkout.
 *
 * Hardened pricing model:
 *  - The caller supplies `items: [{ productId, quantity }]` only. Any price
 *    fields in the body are IGNORED.
 *  - For every line we fetch the live Product, validate active+stock, and
 *    use Product.price for line.price. That feeds Order.total and the
 *    vendor payout split — neither can be tampered with from the client.
 *  - Shipping cost is supplied by the client but capped at a sane maximum
 *    (£100) and clamped to >= 0. The real shipping math should live in
 *    /api/shipping/rates and be re-fetched here, but capping is a tight
 *    floor for now.
 *  - Discount codes are validated server-side against the live Discount
 *    table and applied to the SERVER subtotal — the client subtotal is
 *    not consulted anywhere.
 *
 * Closes Critical finding C5 (client-supplied prices stored as truth).
 */

interface OrderItemInput {
  productId?: string
  productName?: string // optional — falls back to DB if missing
  quantity: number
  /** If the buyer chose a specific condition variant on the PDP. */
  variantId?: string
}

interface CreateOrderBody {
  name: string
  email: string
  phone?: string
  address?: string
  shippingLine1?: string
  shippingLine2?: string
  shippingCity?: string
  shippingPostcode?: string
  shippingCountry?: string
  shippingMethod?: string
  shippingCost?: number
  items: OrderItemInput[]
  discountCode?: string
}

const MAX_SHIPPING_COST = 100 // hard ceiling in GBP

export async function POST(req: NextRequest) {
  try {
    const body: CreateOrderBody = await req.json()

    const {
      name,
      email,
      phone,
      address,
      shippingLine1,
      shippingLine2,
      shippingCity,
      shippingPostcode,
      shippingCountry,
      shippingMethod,
      shippingCost,
      items,
      discountCode,
    } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Order must contain at least one item' },
        { status: 400 },
      )
    }

    // Block-list check: a CustomerProfile flagged `blocked` can't place orders.
    // Generic message so we don't confirm the block to the blocked party.
    const normalisedEmail = String(email).trim().toLowerCase()
    const profile = await db.customerProfile.findUnique({
      where: { email: normalisedEmail },
      select: { blocked: true },
    })
    if (profile?.blocked) {
      return NextResponse.json(
        { error: 'We are unable to process this order. Please contact us.' },
        { status: 403 },
      )
    }

    // Clamp shipping to [0, MAX_SHIPPING_COST]. Reject negatives outright.
    const requestedShipping = typeof shippingCost === 'number' && isFinite(shippingCost) ? shippingCost : 0
    if (requestedShipping < 0) {
      return NextResponse.json({ error: 'Invalid shipping cost' }, { status: 400 })
    }
    const safeShipping = Math.min(MAX_SHIPPING_COST, requestedShipping)

    // ─── Server-side price + stock validation (shared with admin orders) ──
    const { lines, subtotal } = await priceOrderLines(items)

    // ─── Discount math (all server-side) ──────────────────────────────────
    const appliedDiscount = await applyDiscountCode(discountCode, subtotal)
    const discountSavings = appliedDiscount?.savings ?? 0
    const finalTotal = Math.max(0, subtotal + safeShipping - discountSavings)

    // ─── Persist ───────────────────────────────────────────────────────────
    const customer = getCustomerFromRequest(req)

    const order = await db.order.create({
      data: {
        name,
        email,
        phone: phone ?? null,
        address: address ?? null,
        shippingLine1: shippingLine1 ?? null,
        shippingLine2: shippingLine2 ?? null,
        shippingCity: shippingCity ?? null,
        shippingPostcode: shippingPostcode ?? null,
        shippingCountry: shippingCountry ?? 'GB',
        shippingMethod: shippingMethod ?? null,
        shippingCost: safeShipping,
        status: 'pending',
        total: finalTotal,
        userId: customer?.userId ?? null,
        discountCode: appliedDiscount?.code ?? null,
        discountAmount: discountSavings,
        items: {
          create: buildOrderItemCreates(lines),
        },
      },
      include: { items: true },
    })

    // Bump discount uses once, atomically.
    if (appliedDiscount?.id) {
      db.discount.update({
        where: { id: appliedDiscount.id },
        data: { uses: { increment: 1 } },
      }).catch(err => console.error('Discount usage increment failed:', err))
    }

    // ─── Emails (fire-and-forget) ─────────────────────────────────────────
    const emailData = {
      orderId: order.id,
      customerName: order.name,
      customerEmail: order.email,
      items: order.items.map(i => ({
        productName: i.productName,
        quantity: i.quantity,
        price: i.price,
      })),
      subtotal,
      shippingCost: safeShipping,
      discount: discountSavings,
      total: finalTotal,
      shippingMethod,
      shippingAddress: [shippingLine1, shippingCity, shippingPostcode]
        .filter(Boolean)
        .join(', '),
    }
    Promise.allSettled([
      sendOrderConfirmation(emailData),
      sendAdminOrderNotification(emailData),
    ]).catch(() => {})

    return NextResponse.json({ orderId: order.id, total: finalTotal, success: true }, { status: 201 })
  } catch (error) {
    if (error instanceof PricingError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Failed to create order:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 },
    )
  }
}
