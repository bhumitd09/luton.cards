import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdminSession } from '@/lib/admin-auth'
import { isSuperadmin } from '@/lib/vendor-auth'

/**
 * /api/admin/payouts
 *
 * Per-vendor sales + payout aggregation.
 *
 * GET → returns one row per vendor with:
 *   - totalSales        : gross £ across all their OrderItems (price × qty)
 *   - vendorPayoutOwed  : £ owed and not yet marked paid
 *   - vendorPayoutPaid  : £ already settled
 *   - platformFeeTotal  : £ the platform retained
 *   - itemsCount        : number of line items
 *   - lastSaleAt        : most recent order date for this vendor
 *
 * Vendors see only their own row; superadmin sees everyone.
 *
 * POST → mark a list of OrderItem ids paid/unpaid.
 *   Body: { itemIds: string[], action?: 'pay' | 'unpay', note?: string }
 *   action defaults to 'pay'. 'unpay' clears payoutPaidAt + payoutNote.
 *   Superadmin only. Idempotent — only items in the relevant state are touched.
 */

export const dynamic = 'force-dynamic'

type PayoutRow = {
  vendorId: string | null
  vendorName: string | null
  vendorEmail: string | null
  commissionRate: number
  payoutNotes: string | null
  totalSales: number
  vendorPayoutOwed: number
  vendorPayoutPaid: number
  platformFeeTotal: number
  itemsCount: number
  lastSaleAt: string | null
}

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminSession(req)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const includeItems = searchParams.get('items') === '1'

    // Vendor scope — vendors only see their own; superadmin sees all.
    const baseWhere = isSuperadmin(admin) ? {} : { vendorId: admin.userId }

    // Pull every OrderItem with non-null vendorId, join the vendor + order.
    // We aggregate in JS because we need both paid and owed splits.
    const items = await db.orderItem.findMany({
      where: { ...baseWhere, vendorId: { not: null } },
      include: {
        vendor: {
          select: { id: true, name: true, email: true, commissionRate: true, payoutNotes: true },
        },
        order: { select: { id: true, createdAt: true, status: true, email: true } },
      },
      orderBy: { order: { createdAt: 'desc' } },
    })

    // Group by vendor
    const byVendor = new Map<string, PayoutRow>()
    for (const it of items) {
      const vid = it.vendorId
      if (!vid) continue
      let row = byVendor.get(vid)
      if (!row) {
        row = {
          vendorId: vid,
          vendorName: it.vendor?.name ?? null,
          vendorEmail: it.vendor?.email ?? null,
          commissionRate: it.vendor?.commissionRate ?? 0,
          payoutNotes: it.vendor?.payoutNotes ?? null,
          totalSales: 0,
          vendorPayoutOwed: 0,
          vendorPayoutPaid: 0,
          platformFeeTotal: 0,
          itemsCount: 0,
          lastSaleAt: null,
        }
        byVendor.set(vid, row)
      }
      const lineTotal = it.price * it.quantity
      row.totalSales = round2(row.totalSales + lineTotal)
      if (it.payoutPaidAt) {
        row.vendorPayoutPaid = round2(row.vendorPayoutPaid + it.vendorPayout)
      } else {
        row.vendorPayoutOwed = round2(row.vendorPayoutOwed + it.vendorPayout)
      }
      row.platformFeeTotal = round2(row.platformFeeTotal + it.platformFee)
      row.itemsCount += 1
      const orderDate = it.order?.createdAt ? new Date(it.order.createdAt).toISOString() : null
      if (orderDate && (!row.lastSaleAt || orderDate > row.lastSaleAt)) {
        row.lastSaleAt = orderDate
      }
    }

    const rows = Array.from(byVendor.values()).sort((a, b) =>
      b.vendorPayoutOwed - a.vendorPayoutOwed
    )

    if (!includeItems) {
      return NextResponse.json({ rows })
    }

    // Optionally return all the underlying line items so the UI can drill in.
    const detailed = items.map(it => ({
      id: it.id,
      orderId: it.orderId,
      orderEmail: it.order?.email,
      orderStatus: it.order?.status,
      orderDate: it.order?.createdAt,
      productName: it.productName,
      price: it.price,
      quantity: it.quantity,
      lineTotal: round2(it.price * it.quantity),
      vendorId: it.vendorId,
      vendorPayout: it.vendorPayout,
      platformFee: it.platformFee,
      payoutPaidAt: it.payoutPaidAt,
      payoutNote: it.payoutNote,
    }))

    return NextResponse.json({ rows, items: detailed })
  } catch (err) {
    console.error('Payouts GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdminSession(req)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isSuperadmin(admin)) {
      return NextResponse.json({ error: 'Superadmin only' }, { status: 403 })
    }

    const body = await req.json()
    const { itemIds, note } = body
    // action defaults to 'pay' for backwards-compatibility with older callers.
    const action: 'pay' | 'unpay' = body.action === 'unpay' ? 'unpay' : 'pay'
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json({ error: 'itemIds[] required' }, { status: 400 })
    }

    if (action === 'unpay') {
      // Reverse a payout: clear paid timestamp + note for already-paid items.
      const result = await db.orderItem.updateMany({
        where: { id: { in: itemIds }, payoutPaidAt: { not: null } },
        data: {
          payoutPaidAt: null,
          payoutNote: null,
        },
      })
      return NextResponse.json({ marked: result.count })
    }

    const now = new Date()
    const result = await db.orderItem.updateMany({
      where: { id: { in: itemIds }, payoutPaidAt: null },
      data: {
        payoutPaidAt: now,
        payoutNote: typeof note === 'string' ? note.trim() || null : null,
      },
    })

    return NextResponse.json({ marked: result.count })
  } catch (err) {
    console.error('Payouts POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
