import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdminSession } from '@/lib/admin-auth'
import { isSuperadmin } from '@/lib/vendor-auth'

export const dynamic = 'force-dynamic'

/**
 * Order CSV export. Superadmin only — vendors don't get to download the
 * entire order book (with customer emails, addresses and phone numbers).
 * Closes part of Critical finding C6.
 */
export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminSession(req)
    if (!admin) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }
    if (!isSuperadmin(admin)) {
      return new Response(JSON.stringify({ error: 'Superadmin only' }), { status: 403 })
    }

    const orders = await db.order.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    })

    const headers = [
      'Order ID',
      'Date',
      'Customer Name',
      'Email',
      'Phone',
      'Status',
      'Shipping Method',
      'Shipping Address',
      'Items',
      'Total',
    ]

    const escapeCSV = (val: string | null | undefined): string => {
      if (val == null) return ''
      const str = String(val)
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    const rows = orders.map(order => {
      const itemsStr = (order.items ?? [])
        .map(item => `${item.productName} x ${item.quantity}`)
        .join('; ')

      const addressParts = [
        order.shippingLine1,
        order.shippingCity,
        order.shippingPostcode,
        order.shippingCountry,
      ].filter(Boolean)
      const address = addressParts.join(', ')

      return [
        order.id,
        new Date(order.createdAt).toISOString().slice(0, 10),
        order.name,
        order.email,
        order.phone ?? '',
        order.status,
        order.shippingMethod ?? '',
        address,
        itemsStr,
        order.total.toFixed(2),
      ].map(escapeCSV).join(',')
    })

    const csvString = [headers.join(','), ...rows].join('\n')

    return new Response(csvString, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="orders-export.csv"',
      },
    })
  } catch (error) {
    console.error('Orders export error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 })
  }
}
