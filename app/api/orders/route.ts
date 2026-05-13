import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendOrderConfirmation, sendAdminOrderNotification } from '@/lib/email'
import { getCustomerFromRequest } from '@/lib/customer-auth'

interface OrderItemInput {
  productId: string
  productName: string
  price: number
  quantity: number
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
  total: number
  discountCode?: string
}

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
      total,
      discountCode,
    } = body

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Order must contain at least one item' },
        { status: 400 }
      )
    }

    if (typeof total !== 'number' || total < 0) {
      return NextResponse.json(
        { error: 'Invalid order total' },
        { status: 400 }
      )
    }

    // Server-side discount validation
    let finalTotal = total
    let appliedDiscount: { id: string; type: string; value: number } | null = null

    if (discountCode) {
      const discount = await db.discount.findUnique({
        where: { code: discountCode.trim().toUpperCase() },
      })

      if (
        discount &&
        discount.active &&
        (!discount.expiresAt || discount.expiresAt > new Date()) &&
        (discount.maxUses == null || discount.uses < discount.maxUses)
      ) {
        // Calculate subtotal from items for minOrder check
        const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

        if (discount.minOrder == null || subtotal >= discount.minOrder) {
          let savings: number
          if (discount.type === 'percentage') {
            savings = (subtotal * discount.value) / 100
          } else {
            savings = Math.min(discount.value, subtotal)
          }
          const resolvedShippingCost = typeof shippingCost === 'number' ? shippingCost : 0
          finalTotal = Math.max(0, subtotal + resolvedShippingCost - savings)
          appliedDiscount = { id: discount.id, type: discount.type, value: discount.value }
        }
      }
    }

    // Validate stock for all items
    for (const item of items) {
      if (!item.productId) continue
      const product = await db.product.findUnique({
        where: { id: item.productId },
        select: { stock: true, name: true, active: true },
      })
      if (!product || !product.active) {
        return NextResponse.json(
          { error: `Product "${item.productName}" is no longer available` },
          { status: 400 }
        )
      }
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Only ${product.stock} unit${product.stock !== 1 ? 's' : ''} of "${item.productName}" available` },
          { status: 400 }
        )
      }
    }

    // Link order to logged-in customer (null for guest checkout)
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
        shippingCost: typeof shippingCost === 'number' ? shippingCost : 0,
        status: 'pending',
        total: finalTotal,
        userId: customer?.userId ?? null,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            price: item.price,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        items: true,
      },
    })

    // Send order confirmation and admin notification emails
    const subtotalForEmail = items.reduce((s, i) => s + i.price * i.quantity, 0)
    const shippingCostForEmail = typeof shippingCost === 'number' ? shippingCost : 0
    const discountForEmail = Math.max(0, subtotalForEmail + shippingCostForEmail - finalTotal)
    const emailData = {
      orderId: order.id,
      customerName: order.name,
      customerEmail: order.email,
      items: order.items.map((i) => ({
        productName: i.productName,
        quantity: i.quantity,
        price: i.price,
      })),
      subtotal: subtotalForEmail,
      shippingCost: shippingCostForEmail,
      discount: discountForEmail,
      total: finalTotal,
      shippingMethod,
      shippingAddress: [shippingLine1, shippingCity, shippingPostcode]
        .filter(Boolean)
        .join(', '),
    }
    await Promise.allSettled([
      sendOrderConfirmation(emailData),
      sendAdminOrderNotification(emailData),
    ])

    // Increment discount uses if a valid code was applied
    if (appliedDiscount) {
      await db.discount.update({
        where: { id: appliedDiscount.id },
        data: { uses: { increment: 1 } },
      }).catch(() => {})
    }

    // After order is created, decrement stock for each item
    for (const item of items) {
      if (item.productId) {
        await db.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        }).catch(() => {})
      }
    }

    return NextResponse.json({ orderId: order.id, success: true }, { status: 201 })
  } catch (error) {
    console.error('Failed to create order:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}
