import { db } from '@/lib/db'
import type { AdminJwtPayload } from '@/lib/admin-auth'

/**
 * Vendor authorization helpers.
 *
 * Permission model:
 *   - role='superadmin'  → can SEE all products / orders / payouts
 *                          but can only EDIT/DELETE products they own
 *   - role='vendor'      → can only SEE + EDIT their own products
 *
 * This file is the single source of truth for those checks so the rest
 * of the codebase doesn't have to think about it.
 */

export type AccessLevel = 'none' | 'view' | 'edit'

export function isSuperadmin(admin: AdminJwtPayload | null | undefined): boolean {
  return !!admin && admin.role === 'superadmin'
}

/**
 * Returns the product `where` filter the given admin should see in lists.
 * Superadmin gets unscoped (`{}`), vendors get `{ vendorId: theirId }`.
 */
export function productListScope(admin: AdminJwtPayload): Record<string, unknown> {
  if (isSuperadmin(admin)) return {}
  return { vendorId: admin.userId }
}

/**
 * Returns the `Order` where-filter for the given admin. Superadmin sees all,
 * vendor sees only orders that contain at least one OrderItem they own.
 *
 * Used by the admin orders list + detail + export so a vendor account
 * can't read customer PII for orders that belong to another vendor.
 */
export function orderListScope(admin: AdminJwtPayload): Record<string, unknown> {
  if (isSuperadmin(admin)) return {}
  return { items: { some: { vendorId: admin.userId } } }
}

/**
 * Can this admin EDIT (update/delete) this product?
 * Ownership only — even superadmin can't edit another vendor's stock per
 * the founder's request ("I just can't edit and mess around with it").
 */
export async function canEditProduct(admin: AdminJwtPayload, productId: string): Promise<boolean> {
  const product = await db.product.findUnique({
    where: { id: productId },
    select: { vendorId: true },
  })
  if (!product) return false
  // Legacy products without a vendor: only superadmin can adopt them.
  if (!product.vendorId) return isSuperadmin(admin)
  return product.vendorId === admin.userId
}

/**
 * Can this admin VIEW this product in the back office?
 * Superadmin sees all; vendors only see their own.
 */
export async function canViewProduct(admin: AdminJwtPayload, productId: string): Promise<boolean> {
  if (isSuperadmin(admin)) return true
  const product = await db.product.findUnique({
    where: { id: productId },
    select: { vendorId: true },
  })
  return !!product && product.vendorId === admin.userId
}

/**
 * Lookup a vendor's commissionRate (clamped to [0,100]). Used at order
 * placement time to snapshot the split onto each OrderItem.
 */
export async function getCommissionRate(vendorId: string | null | undefined): Promise<number> {
  if (!vendorId) return 0
  const v = await db.adminUser.findUnique({
    where: { id: vendorId },
    select: { commissionRate: true },
  })
  const raw = v?.commissionRate ?? 0
  return Math.max(0, Math.min(100, raw))
}

/**
 * Given a line total (price × qty) and a commission rate percentage,
 * compute the vendor payout + platform fee, both rounded to 2dp.
 * Returns { vendorPayout, platformFee }.
 */
export function splitLineTotal(lineTotal: number, commissionPercent: number): {
  vendorPayout: number
  platformFee: number
} {
  const fee = Math.max(0, Math.min(100, commissionPercent))
  const platformFee = round2(lineTotal * (fee / 100))
  const vendorPayout = round2(lineTotal - platformFee)
  return { vendorPayout, platformFee }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
