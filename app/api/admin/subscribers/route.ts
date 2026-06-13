import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdminSession } from '@/lib/admin-auth'
import { isSuperadmin } from '@/lib/vendor-auth'

export const dynamic = 'force-dynamic'

/**
 * Subscriber lists. Superadmin only — this exposes the email addresses of
 * everyone awaiting a back-in-stock alert and everyone who opted into
 * marketing. Vendors must never reach store-wide subscriber PII.
 *
 * GET                       → { backInStock, marketing }
 * GET ?export=back-in-stock → text/csv download of the back-in-stock list
 * GET ?export=marketing     → text/csv download of the marketing opt-in list
 */

interface BackInStockRow {
  email: string
  productName: string
  productId: string
  createdAt: string
}

interface MarketingRow {
  email: string
  name: string
  createdAt: string
}

/** RFC-4180 CSV cell escaping: wrap in quotes + double inner quotes when the
 *  value contains a comma, quote, or newline. */
function csvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function toCsv(headers: string[], rows: string[][]): string {
  const lines = [headers, ...rows].map(cols => cols.map(csvCell).join(','))
  // Leading BOM so Excel opens UTF-8 correctly; CRLF line endings per spec.
  return '﻿' + lines.join('\r\n')
}

function csvResponse(filename: string, csv: string): NextResponse {
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

async function getBackInStock(): Promise<BackInStockRow[]> {
  const notifications = await db.stockNotification.findMany({
    where: { notifiedAt: null },
    orderBy: { createdAt: 'desc' },
  })

  // Resolve product names in one query, falling back to the raw productId
  // for products that have since been deleted.
  const productIds = Array.from(new Set(notifications.map(n => n.productId)))
  const products = productIds.length
    ? await db.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true },
      })
    : []
  const nameById = new Map(products.map(p => [p.id, p.name]))

  return notifications.map(n => ({
    email: n.email,
    productName: nameById.get(n.productId) ?? n.productId,
    productId: n.productId,
    createdAt: n.createdAt.toISOString(),
  }))
}

async function getMarketing(): Promise<MarketingRow[]> {
  const users = await db.user.findMany({
    where: { marketingOptIn: true },
    select: { email: true, name: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  return users.map(u => ({
    email: u.email,
    name: u.name ?? '',
    createdAt: u.createdAt.toISOString(),
  }))
}

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminSession(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!isSuperadmin(admin)) {
      return NextResponse.json({ error: 'Superadmin only' }, { status: 403 })
    }

    const exportType = req.nextUrl.searchParams.get('export')

    if (exportType === 'back-in-stock') {
      const rows = await getBackInStock()
      const csv = toCsv(
        ['Email', 'Product', 'Product ID', 'Date Subscribed'],
        rows.map(r => [r.email, r.productName, r.productId, r.createdAt]),
      )
      return csvResponse('back-in-stock-subscribers.csv', csv)
    }

    if (exportType === 'marketing') {
      const rows = await getMarketing()
      const csv = toCsv(
        ['Email', 'Name', 'Date Joined'],
        rows.map(r => [r.email, r.name, r.createdAt]),
      )
      return csvResponse('marketing-subscribers.csv', csv)
    }

    const [backInStock, marketing] = await Promise.all([
      getBackInStock(),
      getMarketing(),
    ])

    return NextResponse.json({ backInStock, marketing })
  } catch (error) {
    console.error('Subscribers GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
