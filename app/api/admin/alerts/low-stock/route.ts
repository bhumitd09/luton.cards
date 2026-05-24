import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromRequest } from '@/lib/admin-auth'

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
  const admin = getAdminFromRequest(req)
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
  const admin = getAdminFromRequest(req)
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

    const rows = products
      .map(p => {
        const stockColor = p.stock === 0 ? '#ef4444' : '#f59e0b'
        return `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:14px;color:#111;font-weight:600;">${p.name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:12px;color:#666;text-transform:capitalize;">${p.game === 'one-piece' ? 'One Piece' : 'Pokémon'} · ${p.category}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;font-weight:800;color:${stockColor};text-align:right;">${p.stock}</td>
        </tr>`
      })
      .join('')

    const html = `<!DOCTYPE html>
<html><body style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;background:#f5f5f5;padding:24px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;">
    <tr><td style="background:linear-gradient(135deg,#EC1E79 0%,#FF4DA6 100%);padding:24px 32px;">
      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:900;letter-spacing:-0.02em;">Stock Alert · Luton Cards</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">${outOfStock} out of stock · ${low} low (≤${threshold})</p>
    </td></tr>
    <tr><td style="padding:24px 32px;">
      <p style="margin:0 0 16px;color:#444;font-size:14px;">The following products need restocking:</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #eee;border-radius:8px;overflow:hidden;">
        <thead>
          <tr style="background:#fafafa;">
            <th style="padding:10px 12px;text-align:left;font-size:11px;color:#888;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Product</th>
            <th style="padding:10px 12px;text-align:left;font-size:11px;color:#888;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Category</th>
            <th style="padding:10px 12px;text-align:right;font-size:11px;color:#888;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Stock</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="margin:20px 0 0;font-size:13px;color:#666;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/admin/products?stock=out" style="color:#EC1E79;text-decoration:none;font-weight:700;">Manage products in admin →</a>
      </p>
    </td></tr>
    <tr><td style="background:#fafafa;padding:16px 32px;border-top:1px solid #eee;font-size:11px;color:#999;text-align:center;">
      Automated stock alert · Luton Cards
    </td></tr>
  </table>
</body></html>`

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
