import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifySuperadminSession } from '@/lib/admin-auth'
import { buildLowStockHtml } from '@/lib/email'

/**
 * GET  — admin-only preview: returns the current low-stock product list
 *         WITHOUT sending an email. Used by the dashboard widget.
 * POST  — admin-only trigger: returns the same list AND sends an admin
 *         email summarising it. Used by the manual "Send alert now" button.
 *
 * Both respect the threshold from CMS key `low_stock_threshold` (default 2).
 */

type LowStockProduct = {
  id: string
  name: string
  slug: string
  category: string
  game: string
  stock: number
}

async function getThreshold(): Promise<number> {
  try {
    const row = await db.content.findUnique({ where: { key: 'low_stock_threshold' } })
    const n = row?.value ? Number(row.value) : NaN
    return Number.isFinite(n) && n >= 0 ? n : 2
  } catch {
    return 2
  }
}

async function getLowStock(): Promise<{ threshold: number; products: LowStockProduct[] }> {
  const threshold = await getThreshold()
  const products = await db.product.findMany({
    where: {
      active: true,
      stock: { lte: threshold },
    },
    orderBy: { stock: 'asc' },
    select: { id: true, name: true, slug: true, category: true, game: true, stock: true },
    take: 100,
  })
  return { threshold, products }
}

export async function GET(req: NextRequest) {
  const admin = await verifySuperadminSession(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const data = await getLowStock()
    return NextResponse.json(data)
  } catch (err) {
    console.error('Low-stock preview error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const admin = await verifySuperadminSession(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { threshold, products } = await getLowStock()
    const outOfStock = products.filter(p => p.stock === 0).length
    const low = products.length - outOfStock

    if (products.length === 0) {
      return NextResponse.json({ ok: true, sent: false, reason: 'No low-stock products — alert not sent.', threshold, products })
    }

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        ok: false,
        sent: false,
        reason: 'RESEND_API_KEY not set in environment — alert generated but not emailed.',
        threshold,
        products,
      })
    }

    const from = process.env.EMAIL_FROM || 'onboarding@resend.dev'
    const to = process.env.ADMIN_EMAIL || admin.email || 'admin@lutoncards.co.uk'

    const subject = `Luton Cards: ${products.length} product${products.length !== 1 ? 's' : ''} low or out of stock`

    const html = buildLowStockHtml({ threshold, outOfStock, low, products })

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ from, to, subject, html }),
    })

    if (!res.ok) {
      const err = await res.text().catch(() => '')
      return NextResponse.json({
        ok: false,
        sent: false,
        reason: `Resend rejected the email (${res.status}): ${err.slice(0, 200)}`,
        threshold,
        products,
      })
    }

    return NextResponse.json({ ok: true, sent: true, to, threshold, products })
  } catch (err) {
    console.error('Low-stock POST error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
