import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const admin = getAdminFromRequest(req)
    if (!admin) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
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
