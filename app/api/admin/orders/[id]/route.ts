import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdminSession } from '@/lib/admin-auth'
import { isSuperadmin } from '@/lib/vendor-auth'
import { sendShippingNotification } from '@/lib/email'

const VALID_STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled']

/**
 * Single-order endpoint.
 *
 * Auth model:
 *  - GET: any admin can view, but vendors only see orders containing at
 *    least one of their own items, and only their own line items are
 *    returned in the response.
 *  - PUT / PATCH / DELETE: superadmin only. Vendors should never edit
 *    order status, tracking, shipping, or delete an order — those are
 *    platform-level operations affecting the customer and other vendors
 *    on the same order.
 *
 * Closes part of Critical finding C6 (vendor cross-tenant data exposure
 * + cross-tenant mutation).
 */

async function ownsAnyItem(orderId: string, vendorId: string): Promise<boolean> {
  const count = await db.orderItem.count({
    where: { orderId, vendorId },
  })
  return count > 0
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await verifyAdminSession(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const order = await db.order.findUnique({
      where: { id: params.id },
      include: { items: true },
    })
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (!isSuperadmin(admin)) {
      const owned = order.items.some(it => it.vendorId === admin.userId)
      if (!owned) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }
      // Strip other vendors' items so a vendor only sees what's theirs.
      return NextResponse.json({
        order: { ...order, items: order.items.filter(it => it.vendorId === admin.userId) },
      })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Order GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function updateOrder(req: NextRequest, id: string) {
  const admin = await verifyAdminSession(req)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!isSuperadmin(admin)) {
    return NextResponse.json({ error: 'Superadmin only' }, { status: 403 })
  }

  const existing = await db.order.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const body = await req.json()
  const {
    status,
    notes,
    trackingNumber,
    trackingCarrier,
    shippingLine1,
    shippingLine2,
    shippingCity,
    shippingPostcode,
    shippingCountry,
    shippingMethod,
    shippingCost,
  } = body

  if (status && !VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 },
    )
  }

  const order = await db.order.update({
    where: { id },
    data: {
      ...(status !== undefined && { status }),
      ...(notes !== undefined && { notes }),
      ...(trackingNumber !== undefined && { trackingNumber }),
      ...(trackingCarrier !== undefined && { trackingCarrier }),
      ...(shippingLine1 !== undefined && { shippingLine1 }),
      ...(shippingLine2 !== undefined && { shippingLine2 }),
      ...(shippingCity !== undefined && { shippingCity }),
      ...(shippingPostcode !== undefined && { shippingPostcode }),
      ...(shippingCountry !== undefined && { shippingCountry }),
      ...(shippingMethod !== undefined && { shippingMethod }),
      ...(shippingCost !== undefined && { shippingCost }),
    },
    include: { items: true },
  })

  // Send shipping notification when tracking is added and status becomes shipped
  if (order.trackingNumber && order.status === 'shipped') {
    sendShippingNotification({
      orderId: order.id,
      customerName: order.name,
      customerEmail: order.email,
      items: order.items.map((i) => ({
        productName: i.productName,
        quantity: i.quantity,
        price: i.price,
      })),
      subtotal: order.total,
      shippingCost: order.shippingCost ?? 0,
      discount: 0,
      total: order.total,
      trackingNumber: order.trackingNumber,
      trackingCarrier: order.trackingCarrier ?? 'Other',
    }).catch(() => {})
  }

  // Acknowledge we consulted ownsAnyItem helper (kept exported for future use)
  void ownsAnyItem

  return NextResponse.json({ order })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    return await updateOrder(req, params.id)
  } catch (error) {
    console.error('Order PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    return await updateOrder(req, params.id)
  } catch (error) {
    console.error('Order PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await verifyAdminSession(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!isSuperadmin(admin)) {
      return NextResponse.json({ error: 'Superadmin only' }, { status: 403 })
    }

    const existing = await db.order.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    await db.order.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Order DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
