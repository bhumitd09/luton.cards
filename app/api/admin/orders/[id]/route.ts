import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/admin-auth'
import { sendShippingNotification } from '@/lib/email'

const VALID_STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled']

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = getAdminFromRequest(req)
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

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Order GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function updateOrder(req: NextRequest, id: string) {
  const admin = getAdminFromRequest(req)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
      { status: 400 }
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
    const admin = getAdminFromRequest(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
