import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendOrderConfirmation, sendAdminOrderNotification } from '@/lib/email'
import { getCustomerFromRequest } from '@/lib/customer-auth'
import { splitLineTotal } from '@/lib/vendor-auth'

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

    // ─── Server-side price + stock validation ─────────────────────────────
    // Fetch all products in one query, then walk items.
    const productIds = items
      .map(i => i.productId)
      .filter((id): id is string => typeof id === 'string' && id.length > 0)
    if (productIds.length !== items.length) {
      return NextResponse.json({ error: 'Every item must have a productId.' }, { status: 400 })
    }

    const products = await db.product.findMany({
      where: { id: { in: productIds }, active: true },
      select: {
        id: true, name: true, price: true, stock: true,
        vendorId: true,
        vendor: { select: { commissionRate: true } },
        variants: { select: { id: true, condition: true, foil: true, price: true, stock: true, active: true } },
      },
    })
    const productById = new Map(products.map(p => [p.id, p]))

    // Validate every line + build the trusted lineItems we'll persist.
    type Line = {
      productId: string
      productName: string
      price: number
      quantity: number
      variantId: string | null
      variantCondition: string | null
      variantFoil: string | null
      vendorId: string | null
      commissionRate: number
    }
    const lines: Line[] = []
    for (const item of items) {
      const qty = Number(item.quantity)
      if (!Number.isInteger(qty) || qty <= 0 || qty > 99) {
        return NextResponse.json({ error: 'Invalid quantity.' }, { status: 400 })
      }
      const p = productById.get(item.productId as string)
      if (!p) {
        return NextResponse.json(
          { error: 'A product in your basket is no longer available.' },
          { status: 400 },
        )
      }

      // Variant-aware pricing + stock: if the client passed a variantId,
      // it MUST exist on this product, be active, and have stock. Price +
      // stock come from the variant row, never from the request body.
      let variantId: string | null = null
      let variantCondition: string | null = null
      let variantFoil: string | null = null
      let unitPrice = p.price
      let availableStock = p.stock

      if (item.variantId) {
        const v = p.variants.find(x => x.id === item.variantId)
        if (!v || !v.active) {
          return NextResponse.json(
            { error: `The selected variant of "${p.name}" is no longer available.` },
            { status: 400 },
          )
        }
        variantId = v.id
        variantCondition = v.condition
        variantFoil = v.foil
        unitPrice = v.price
        availableStock = v.stock
      } else if (p.variants.length > 0) {
        // Product has variants but caller didn't pick one — reject so we
        // don't sell at the (likely undefined) base price by accident.
        return NextResponse.json(
          { error: `Please choose a condition for "${p.name}" before checking out.` },
          { status: 400 },
        )
      }

      if (availableStock < qty) {
        return NextResponse.json(
          { error: `Only ${availableStock} of "${p.name}" left in stock.` },
          { status: 400 },
        )
      }

      lines.push({
        productId: p.id,
        productName: p.name,
        price: unitPrice,
        quantity: qty,
        variantId,
        variantCondition,
        variantFoil,
        vendorId: p.vendorId ?? null,
        commissionRate: p.vendor?.commissionRate ?? 0,
      })
    }

    // ─── Subtotal + discount math (all server-side) ───────────────────────
    const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0)

    let appliedDiscount: { id: string; code: string; type: string; value: number; savings: number } | null = null
    if (discountCode && typeof discountCode === 'string') {
      const discount = await db.discount.findUnique({
        where: { code: discountCode.trim().toUpperCase() },
      })
      const ok = discount
        && discount.active
        && (!discount.expiresAt || discount.expiresAt > new Date())
        && (discount.maxUses == null || discount.uses < discount.maxUses)
        && (discount.minOrder == null || subtotal >= discount.minOrder)
      if (ok && discount) {
        const savingsRaw = discount.type === 'percentage'
          ? (subtotal * discount.value) / 100
          : discount.value
        const savings = Math.min(savingsRaw, subtotal)
        appliedDiscount = {
          id: discount.id,
          code: discount.code,
          type: discount.type,
          value: discount.value,
          savings,
        }
      }
    }

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
          create: lines.map(l => {
            const lineTotal = l.price * l.quantity
            const { vendorPayout, platformFee } = splitLineTotal(lineTotal, l.commissionRate)
            return {
              productId: l.productId,
              productName: l.productName,
              price: l.price,
              quantity: l.quantity,
              variantId: l.variantId,
              variantCondition: l.variantCondition,
              variantFoil: l.variantFoil,
              vendorId: l.vendorId,
              vendorPayout,
              platformFee,
            }
          }),
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
    console.error('Failed to create order:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 },
    )
  }
}
